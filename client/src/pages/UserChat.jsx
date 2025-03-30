import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';

const UserChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialChatId = searchParams.get('chatId');
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sentMessagesRef = useRef(new Set()); // Track sent message IDs to prevent duplicates
  const reconnectingRef = useRef(false);

  // Get token and user info
  useEffect(() => {
    const token = localStorage.getItem('Token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: decodedToken.id,
          role: decodedToken.role,
          name: decodedToken.name
        });
        console.log("User data loaded:", {
          id: decodedToken.id,
          role: decodedToken.role,
          name: decodedToken.name
        });
      } catch (error) {
        console.error('Failed to decode token:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Initialize socket connection with reconnection support
  useEffect(() => {
    if (!user) return;
    
    const token = localStorage.getItem('Token');
    // Remove any quotes if they exist in the token
    const cleanToken = token.replace(/^"|"$/g, '');
    
    console.log("User data for socket:", {
      id: user.id,
      role: user.role,
      name: user.name
    });
    
    const newSocket = io('http://localhost:8870', {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      setError(null); // Clear any connection errors
      reconnectingRef.current = false;
      
      // Authenticate socket - ensure IDs are parsed as integers and use cleaned token
      newSocket.emit('authenticate', {
        userId: user.role === 'STUDENT' ? parseInt(user.id) : null,
        hostelOwnerId: user.role === 'hostelOwner' ? parseInt(user.id) : null,
        token: cleanToken
      });
    });

    // Add a listener for authenticated event
    newSocket.on('authenticated', (data) => {
      console.log("Socket authenticated successfully:", data);
      
      // If there was a selected chat, join the room after authentication is confirmed
      if (selectedChat) {
        console.log("Joining chat after auth:", selectedChat.id);
        setTimeout(() => {
          newSocket.emit('join_chat', parseInt(selectedChat.id));
        }, 300); // Small delay to ensure auth is processed
      }
    });

    // Reconnection events
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      reconnectingRef.current = false;
      
      // Re-authenticate after reconnection - be careful with role case and use clean token
      newSocket.emit('authenticate', {
        userId: user.role === 'STUDENT' ? parseInt(user.id) : null,
        hostelOwnerId: user.role === 'hostelOwner' ? parseInt(user.id) : null,
        token: cleanToken
      });
      
      // If there was a selected chat, rejoin the room
      if (selectedChat) {
        setTimeout(() => {
          newSocket.emit('join_chat', parseInt(selectedChat.id));
        }, 300);
      }
    });

    // Listen for successful chat join confirmation
    newSocket.on('joined_chat', (data) => {
      console.log(`Successfully joined chat ${data.chatId}`);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
      reconnectingRef.current = true;
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      reconnectingRef.current = false;
      setError('Failed to reconnect to the chat server. Please refresh the page.');
    });

    // Handle socket errors
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Connection to chat server failed. Trying to reconnect...');
      reconnectingRef.current = true;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect manually
        newSocket.connect();
      }
    });

    // Handle server-side socket errors
    newSocket.on('error', (errorData) => {
      console.error('Socket error from server:', errorData);
      if (errorData.message) {
        setError(errorData.message);
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        // Leave any chat rooms
        if (selectedChat) {
          newSocket.emit('leave_chat', parseInt(selectedChat.id));
        }
        newSocket.disconnect();
      }
    };
  }, [user, selectedChat]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for incoming messages
    socket.on('receive_message', (message) => {
      console.log('Received message:', message);
      
      // Make sure message properties exist
      if (!message || !message.chatId) {
        console.error('Received invalid message format:', message);
        return;
      }
      
      // Ensure chatId is treated as a number for comparison
      const messageChatId = parseInt(message.chatId);
      const currentChatId = selectedChat ? parseInt(selectedChat.id) : null;
      
      // Check if we've already processed this message
      if (message.id && sentMessagesRef.current.has(message.id)) {
        console.log('Ignoring duplicate message:', message.id);
        return;
      }
      
      // Check for temp messages to replace
      if (message.id) {
        const tempIds = Array.from(sentMessagesRef.current).filter(id => 
          typeof id === 'string' && id.startsWith('temp-')
        );
        
        for (const tempId of tempIds) {
          // If this is a message we sent earlier with a temp ID, replace it
          if (message.senderId === parseInt(user.id) && 
              message.senderType === (user.role === 'STUDENT' ? 'USER' : 'HOSTEL_OWNER')) {
            // Remove the temp ID
            sentMessagesRef.current.delete(tempId);
            break;
          }
        }
        
        // Add the real message ID to our tracking set
        sentMessagesRef.current.add(message.id);
      }
      
      // Add message to the current chat if it belongs to the selected chat
      if (currentChatId && messageChatId === currentChatId) {
        // Format the message to match our component's expected structure
        const formattedMessage = {
          ...message,
          id: message.id || `server-${Date.now()}`,
          content: message.content || "",
          timestamp: message.timestamp || new Date().toISOString(),
          isRead: message.isRead || false,
          senderType: message.senderType
        };
        
        setMessages(prev => {
          // Check if this message already exists in our messages
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) return prev;
          
          // Replace temp message if this is a confirmation of a message we sent
          const tempIndex = prev.findIndex(msg => 
            msg.id && msg.id.toString().startsWith('temp-') && 
            msg.content === message.content && 
            msg.senderType === message.senderType
          );
          
          if (tempIndex >= 0) {
            const newMessages = [...prev];
            newMessages[tempIndex] = formattedMessage;
            return newMessages;
          }
          
          // Otherwise just add the new message
          return [...prev, formattedMessage];
        });
        
        // Mark as read if we're the recipient
        if (
          (user.role === 'STUDENT' && message.senderType === 'HOSTEL_OWNER') ||
          (user.role === 'hostelOwner' && message.senderType === 'USER')
        ) {
          markMessagesAsRead(currentChatId);
        }
      }
      
      // Update chat list to show latest message
      setChats(prev => {
        const updatedChats = [...prev];
        const chatIndex = updatedChats.findIndex(c => parseInt(c.id) === messageChatId);
        
        if (chatIndex !== -1) {
          // Create a copy of the chat
          const chat = { ...updatedChats[chatIndex] };
          
          // Update last message
          chat.lastMessage = message;
          
          // Increment unread count if the chat isn't selected
          if (!currentChatId || currentChatId !== messageChatId) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
          
          // Remove the chat from its current position
          updatedChats.splice(chatIndex, 1);
          
          // Add it to the beginning of the array
          updatedChats.unshift(chat);
          
          return updatedChats;
        }
        
        return prev;
      });
    });

    // Typing indicators
    socket.on('user_typing', (data) => {
      if (selectedChat && parseInt(data.chatId) === parseInt(selectedChat.id)) {
        setTyping(true);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (selectedChat && parseInt(data.chatId) === parseInt(selectedChat.id)) {
        setTyping(false);
      }
    });

    // Messages read status
    socket.on('messages_read', (data) => {
      // Update read status for messages
      if (selectedChat && parseInt(data.chatId) === parseInt(selectedChat.id)) {
        setMessages(prev => 
          prev.map(msg => {
            // If message is from our user and the reader is the other person
            if (
              (user.role === 'STUDENT' && msg.senderType === 'USER' && data.readerType === 'HOSTEL_OWNER') ||
              (user.role === 'hostelOwner' && msg.senderType === 'HOSTEL_OWNER' && data.readerType === 'USER')
            ) {
              return { ...msg, isRead: true };
            }
            return msg;
          })
        );
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('messages_read');
      socket.off('error');
      socket.off('authenticated');
      socket.off('joined_chat');
    };
  }, [socket, selectedChat, user]);

  // Fetch user's chats
  useEffect(() => {
    if (!user) return;
    
    const fetchChats = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('Token');
        const endpoint = user.role === 'STUDENT' 
          ? `/chat/user/${user.id}` 
          : `/chat/hostel-owner/${user.id}`;
        
        const response = await axios.get(`http://localhost:8870${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setChats(response.data.chats);
          
          // If there's a chatId in the URL, select that chat
          if (initialChatId) {
            const chat = response.data.chats.find(c => c.id === parseInt(initialChatId));
            if (chat) {
              selectChat(chat);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
    
    // Set up polling for new chats every minute (as a fallback)
    const interval = setInterval(() => {
      if (!reconnectingRef.current) {
        fetchChats();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user, initialChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select a chat and load its messages
  const selectChat = async (chat) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Token');
      const parsedChatId = parseInt(chat.id);
      
      const response = await axios.get(`http://localhost:8870/chat/${parsedChatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSelectedChat(response.data.chat);
        
        // Add all message IDs to our tracking set to prevent duplicates
        const receivedMessages = response.data.chat.messages || [];
        receivedMessages.forEach(msg => {
          if (msg.id) {
            sentMessagesRef.current.add(msg.id);
          }
        });
        
        setMessages(receivedMessages);
        
        // Join the chat room in socket
        if (socket && socket.connected) {
          console.log(`Joining chat: ${parsedChatId}`);
          socket.emit('join_chat', parsedChatId);
        }
        
        // Mark messages as read
        markMessagesAsRead(parsedChatId);
        
        // Update URL without page reload
        navigate(`/userchat?chatId=${parsedChatId}`, { replace: true });
        
        // Update unread count in chat list
        setChats(prev => 
          prev.map(c => 
            c.id === chat.id ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (chatId) => {
    try {
      if (!user || !user.id) {
        console.warn("Cannot mark messages as read: user not loaded");
        return;
      }
      
      const token = localStorage.getItem('Token');
      const parsedChatId = parseInt(chatId);
      const readerType = user.role === 'STUDENT' ? 'USER' : 'HOSTEL_OWNER';
      const readerId = parseInt(user.id);
      
      // Emit socket event for real-time updates
      if (socket && socket.connected) {
        console.log(`Marking messages as read in chat ${parsedChatId}`);
        socket.emit('mark_read', {
          chatId: parsedChatId,
          readerType,
          readerId
        });
      } else {
        console.warn("Socket not connected when trying to mark messages as read");
      }
      
      // Send API request to mark as read
      await axios.put('http://localhost:8870/chat/message/read', 
        { chatId: parsedChatId, readerType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send a message - FIXED to prevent duplicates and handle reconnection
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      const token = localStorage.getItem('Token');
      const chatIdNum = parseInt(selectedChat.id);
      const senderIdNum = parseInt(user.id);
      
      const messageData = {
        chatId: chatIdNum,
        senderId: senderIdNum,
        senderType: user.role === 'STUDENT' ? 'USER' : 'HOSTEL_OWNER',
        content: newMessage.trim()
      };
      
      // Clear input first to prevent double-sends if user types quickly
      const messageToSend = newMessage.trim();
      setNewMessage('');
      
      // Generate a temporary ID for local tracking
      const tempId = `temp-${Date.now()}`;
      
      // Add the message to our local state immediately for better UX
      const tempMessage = {
        ...messageData,
        id: tempId,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      // Add to our messages immediately for real-time effect
      setMessages(prev => [...prev, tempMessage]);
      
      // Track this message ID to prevent duplicates when we receive it back
      sentMessagesRef.current.add(tempId);
      
      console.log("Sending message via socket:", messageData);
      
      // Send via Socket for real-time
      if (socket && socket.connected) {
        socket.emit('send_message', messageData);
      } else {
        console.warn('Socket not connected, falling back to API');
        // Fall back to API if socket is not connected
        try {
          const response = await axios.post('http://localhost:8870/chat/message', 
            messageData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('API response:', response.data);
        } catch (apiError) {
          console.error('API message sending failed:', apiError);
          throw apiError; // Re-throw to be caught by outer catch
        }
      }
      
      // Clear typing indicator
      if (socket && socket.connected) {
        socket.emit('stop_typing', {
          chatId: chatIdNum,
          userId: user.role === 'STUDENT' ? senderIdNum : null,
          hostelOwnerId: user.role === 'hostelOwner' ? senderIdNum : null
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Re-enable input if there was an error
      setNewMessage(newMessage);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !socket.connected || !selectedChat || !user) return;
    
    const chatIdNum = parseInt(selectedChat.id);
    const userIdNum = parseInt(user.id);
    
    // Send typing event
    socket.emit('typing', {
      chatId: chatIdNum,
      userId: user.role === 'STUDENT' ? userIdNum : null,
      hostelOwnerId: user.role === 'hostelOwner' ? userIdNum : null
    });
    
    // Clear existing timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && socket.connected) {
        socket.emit('stop_typing', {
          chatId: chatIdNum,
          userId: user.role === 'STUDENT' ? userIdNum : null,
          hostelOwnerId: user.role === 'hostelOwner' ? userIdNum : null
        });
      }
    }, 2000);
  };

  // Format date for message groups
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'PPP'); // e.g., "Apr 29, 2023"
    }
  };

  // Get chat name and image based on user role
  const getChatInfo = (chat) => {
    if (!chat) return { name: '', image: null };
    
    if (user?.role === 'STUDENT') {
      return {
        name: chat.hostelOwner?.hostelName || chat.hostelOwner?.ownerName || 'Hostel',
        image: chat.hostelOwner?.mainPhoto
      };
    } else {
      return {
        name: chat.user?.name || 'User',
        image: chat.user?.profileImage
      };
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      displayDate: formatMessageDate(date),
      messages: msgs
    }));
  };

  // Get message time
  const getMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  // Get total unread messages
  const getTotalUnreadCount = () => {
    return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Connection Status */}
      {error && (
        <div className="bg-red-500 text-white p-2 text-center">
          {error}
        </div>
      )}
      
      {reconnectingRef.current && (
        <div className="bg-yellow-500 text-white p-2 text-center">
          Reconnecting to chat server...
        </div>
      )}

      {/* Chat Interface */}
      <div className="container mx-auto px-4 py-6 flex flex-1 overflow-hidden">
        <div className="w-full flex rounded-lg shadow-lg overflow-hidden">
          {/* Chat Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-800 text-white">
              <h2 className="text-lg font-semibold">Messages</h2>
              {getTotalUnreadCount() > 0 && (
                <p className="text-sm mt-1 text-gray-300">
                  {getTotalUnreadCount()} unread {getTotalUnreadCount() === 1 ? 'message' : 'messages'}
                </p>
              )}
            </div>
            
            {loading && chats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-700"></div>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg text-gray-600 font-medium">No conversations yet</p>
                <p className="text-sm mt-2 text-gray-500">Start chatting with hostel owners</p>
                <button 
                  onClick={() => navigate('/hostels')}
                  className="mt-6 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Browse Hostels
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {chats.map(chat => {
                    const chatInfo = getChatInfo(chat);
                    const lastMessage = chat.messages?.[0] || chat.lastMessage;
                    const isActive = selectedChat?.id === chat.id;
                    
                    return (
                      <li 
                        key={chat.id}
                        onClick={() => selectChat(chat)}
                        className={`hover:bg-gray-100 cursor-pointer transition-colors ${isActive ? 'bg-gray-200' : ''}`}
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {chatInfo.image ? (
                                <img 
                                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                  src={chatInfo.image}
                                  alt={chatInfo.name}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 border-2 border-gray-300">
                                  <span className="text-xl font-medium">{chatInfo.name.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-800'} truncate`}>
                                  {chatInfo.name}
                                </p>
                                {lastMessage && lastMessage.timestamp && (
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(lastMessage.timestamp), 'h:mm a')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className={`text-xs ${chat.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'} truncate`}>
                                  {lastMessage ? (lastMessage.content || '') : 'No messages yet'}
                                </p>
                                {chat.unreadCount > 0 && (
                                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-800 text-xs font-medium text-white">
                                    {chat.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-gray-200 p-4 flex items-center bg-white shadow-sm">
                  <div className="flex items-center flex-1">
                    {getChatInfo(selectedChat).image ? (
                      <img 
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 mr-3"
                        src={getChatInfo(selectedChat).image}
                        alt={getChatInfo(selectedChat).name}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3 border-2 border-gray-300">
                        <span className="text-xl font-medium">{getChatInfo(selectedChat).name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{getChatInfo(selectedChat).name}</h2>
                      {typing && <p className="text-xs text-gray-600 mt-1">Typing...</p>}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p className="text-lg text-gray-600 font-medium">No messages yet</p>
                      <p className="text-sm mt-2 text-gray-500">Start the conversation by sending a message.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupMessagesByDate().map(group => (
                        <div key={group.date} className="space-y-4">
                          <div className="flex justify-center">
                            <span className="px-4 py-1 bg-gray-200 rounded-full text-xs text-gray-600 font-medium">
                              {group.displayDate}
                            </span>
                          </div>
                          
                          {group.messages.map(message => {
                            const isCurrentUser = (
                              (user?.role === 'STUDENT' && message.senderType === 'USER') ||
                              (user?.role === 'hostelOwner' && message.senderType === 'HOSTEL_OWNER')
                            );
                            
                            return (
                              <div 
                                key={message.id} 
                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    isCurrentUser 
                                      ? 'bg-gray-800 text-white rounded-tr-none' 
                                      : 'bg-gray-200 text-gray-900 rounded-tl-none'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <div className={`text-xs mt-1 flex items-center ${isCurrentUser ? 'text-gray-300 justify-end' : 'text-gray-500'}`}>
                                    <span>{getMessageTime(message.timestamp)}</span>
                                    {isCurrentUser && (
                                      <span className="ml-2">
                                        {message.isRead ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path d="M9.979 2a8 8 0 00-7.88 9.626 1 1 0 01-.6 1.13A8.001 8.001 0 0018 10.001v-.022a8.001 8.001 0 00-8.021-7.979z" />
                                          </svg>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      
                      <div ref={messagesEndRef} />
                      
                      {typing && (
                        <div className="flex justify-start">
                          <div className="bg-gray-200 text-gray-900 rounded-lg rounded-tl-none px-4 py-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 px-4 py-3 bg-white">
                  <form onSubmit={sendMessage} className="flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      className="block w-full rounded-full border border-gray-300 px-4 py-2 focus:border-gray-500 focus:ring-gray-500 text-sm"
                      placeholder="Type a message..."
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`ml-2 p-2 rounded-full ${
                        newMessage.trim() 
                          ? 'bg-gray-800 text-white hover:bg-gray-700' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      } transition-colors`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Your Messages</h3>
                <p className="text-center text-gray-500 max-w-xs mb-8">
                  {chats.length > 0 
                    ? 'Select a conversation to start messaging' 
                    : 'Start chatting with hostel owners to find your perfect accommodation'}
                </p>
                {user?.role === 'STUDENT' && (
                  <button 
                    onClick={() => navigate('/hostels')}
                    className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Browse Hostels
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserChat;