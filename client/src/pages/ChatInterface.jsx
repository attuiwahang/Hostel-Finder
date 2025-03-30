import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Phone, Video, Info, Paperclip, Send, MoreVertical, ChevronLeft, Menu } from 'lucide-react';
import OwnerNav from '../components/OwnerNav';
import Topbar from '../components/Topbar';
import axios from 'axios';
import io from 'socket.io-client';
import { format } from 'date-fns';

const ChatInterface = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sentMessagesRef = useRef(new Set()); // Track sent message IDs to prevent duplicates
  const reconnectingRef = useRef(false);
  
  // Handle sidebar collapse state
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  // Get token and user info
  useEffect(() => {
    const token = localStorage.getItem("Token");
    console.log(token);
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
      }
    }
  }, []);

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowChatList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      // Authenticate socket with correct role case and parse IDs as integers
      newSocket.emit('authenticate', {
        userId: user.role === 'STUDENT' ? parseInt(user.id) : null,
        hostelOwnerId: user.role === 'hostelOwner' ? parseInt(user.id) : null,
        token: cleanToken
      });
    });

    // Handle authentication response
    newSocket.on('authenticated', (data) => {
      console.log("Socket authenticated successfully:", data);
      
      // If there was a selected chat, join the room after authentication is confirmed
      if (selectedChatId) {
        console.log("Joining chat after auth:", selectedChatId);
        setTimeout(() => {
          newSocket.emit('join_chat', parseInt(selectedChatId));
        }, 300); // Small delay to ensure auth is processed
      }
    });

    // Reconnection events
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      reconnectingRef.current = false;
      
      // Re-authenticate after reconnection
      newSocket.emit('authenticate', {
        userId: user.role === 'STUDENT' ? parseInt(user.id) : null,
        hostelOwnerId: user.role === 'hostelOwner' ? parseInt(user.id) : null,
        token: cleanToken
      });
      
      // If there was a selected chat, rejoin the room
      if (selectedChatId) {
        setTimeout(() => {
          newSocket.emit('join_chat', parseInt(selectedChatId));
        }, 300);
      }
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

    // Listen for successful chat join confirmation
    newSocket.on('joined_chat', (data) => {
      console.log(`Successfully joined chat ${data.chatId}`);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        // Leave any chat rooms
        if (selectedChatId) {
          newSocket.emit('leave_chat', parseInt(selectedChatId));
        }
        newSocket.disconnect();
      }
    };
  }, [user, selectedChatId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

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
      const currentChatId = selectedChatId ? parseInt(selectedChatId) : null;
      
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
          text: message.content, // Ensure the text property exists for rendering
          time: format(new Date(message.timestamp || new Date()), 'h:mm a'),
          isUser: message.senderType === 'USER',
          isRead: message.isRead || false,
          timestamp: message.timestamp || new Date().toISOString(),
          content: message.content,
          chatId: messageChatId
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
        if (message.senderType === 'USER') {
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
          chat.lastMessage = message.content;
          chat.time = format(new Date(message.timestamp || new Date()), 'h:mm a');
          
          // Increment unread count if the chat isn't selected
          if (!currentChatId || currentChatId !== messageChatId) {
            chat.unread = (chat.unread || 0) + 1;
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
      if (selectedChatId && parseInt(data.chatId) === parseInt(selectedChatId)) {
        setTyping(true);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (selectedChatId && parseInt(data.chatId) === parseInt(selectedChatId)) {
        setTyping(false);
      }
    });

    // Messages read status
    socket.on('messages_read', (data) => {
      // Update read status for messages
      if (selectedChatId && parseInt(data.chatId) === parseInt(selectedChatId)) {
        setMessages(prev => 
          prev.map(msg => {
            // If message is from hostel owner and the reader is the user
            if (msg.senderType === 'HOSTEL_OWNER' && data.readerType === 'USER') {
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
  }, [socket, selectedChatId, user]);

  // Fetch hostel owner's chats
  useEffect(() => {
    if (!user) return;
    
    const fetchChats = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('Token');
        const endpoint = `/chat/hostel-owner/${user.id}`;
        
        const response = await axios.get(`http://localhost:8870${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Transform the data to match our component structure
          const transformedChats = response.data.chats.map(chat => ({
            id: chat.id,
            name: chat.user?.name || 'User',
            status: 'Online', // You might need to implement actual online status
            time: chat.messages && chat.messages[0] 
              ? format(new Date(chat.messages[0].timestamp), 'h:mm a') 
              : 'No messages',
            avatar: chat.user?.name?.charAt(0) || 'U',
            lastMessage: chat.messages && chat.messages[0] ? chat.messages[0].content : 'No messages yet',
            unread: chat.unreadCount || 0
          }));
          
          setChats(transformedChats);
          
          // If there are chats, select the first one by default
          if (transformedChats.length > 0 && !selectedChatId) {
            setSelectedChatId(transformedChats[0].id);
            loadMessages(transformedChats[0].id);
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
    
    // Set up polling for new chats every minute
    const interval = setInterval(() => {
      if (!reconnectingRef.current) {
        fetchChats();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages for a chat
  const loadMessages = async (chatId) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('Token');
      
      // Ensure chatId is passed as a number
      const parsedChatId = parseInt(chatId);
      
      const response = await axios.get(`http://localhost:8870/chat/${parsedChatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Add all message IDs to our tracking set to prevent duplicates
        const receivedMessages = response.data.chat.messages || [];
        receivedMessages.forEach(msg => {
          if (msg.id) {
            sentMessagesRef.current.add(msg.id);
          }
        });
        
        // Transform messages to match our component structure
        const transformedMessages = receivedMessages.map(msg => ({
          id: msg.id,
          sender: msg.senderType === 'USER' ? 'User' : 'Owner',
          text: msg.content,
          time: format(new Date(msg.timestamp), 'h:mm a'),
          isUser: msg.senderType === 'USER',
          isRead: msg.isRead,
          timestamp: msg.timestamp,
          senderType: msg.senderType,
          content: msg.content,
          chatId: parsedChatId
        }));
        
        setMessages(transformedMessages);
        
        // Join the chat room in socket
        if (socket && socket.connected) {
          console.log(`Joining chat room: ${parsedChatId}`);
          socket.emit('join_chat', parsedChatId);
        } else {
          console.warn("Socket not connected when trying to join chat");
        }
        
        // Mark messages as read
        markMessagesAsRead(parsedChatId);
        
        // Update unread count in chat list
        setChats(prev => 
          prev.map(c => 
            parseInt(c.id) === parsedChatId ? { ...c, unread: 0 } : c
          )
        );
      } else {
        console.error("API returned success: false when loading messages");
        setError("Failed to load messages: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoadingMessages(false);
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
      const readerType = 'HOSTEL_OWNER';
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

  // Send a message - updated to prevent duplicates and handle reconnection
  const handleSendMessage = async () => {
    if (message.trim() === '' || !selectedChatId) return;
    
    try {
      const token = localStorage.getItem('Token');
      
      // Ensure the chat ID is a number
      const chatIdNum = parseInt(selectedChatId);
      const senderIdNum = parseInt(user.id);
      
      const messageData = {
        chatId: chatIdNum,
        senderId: senderIdNum,
        senderType: 'HOSTEL_OWNER',
        content: message.trim()
      };
      
      // Clear input first to prevent double-sends if user types quickly
      const messageToSend = message.trim();
      setMessage('');
      
      // Generate a temporary ID for local tracking
      const tempId = `temp-${Date.now()}`;
      
      // Add the message to our local state immediately for better UX
      const tempMessage = {
        id: tempId,
        sender: 'Owner',
        text: messageToSend,
        time: format(new Date(), 'h:mm a'),
        isUser: false,
        isRead: false,
        timestamp: new Date().toISOString(),
        senderType: 'HOSTEL_OWNER',
        content: messageToSend,
        chatId: chatIdNum // Important: Include chatId
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
          userId: null,
          hostelOwnerId: senderIdNum
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Re-enable input if there was an error
      setMessage(message);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !socket.connected || !selectedChatId || !user) return;
    
    const chatIdNum = parseInt(selectedChatId);
    const userIdNum = parseInt(user.id);
    
    // Send typing event
    socket.emit('typing', {
      chatId: chatIdNum,
      userId: null,
      hostelOwnerId: userIdNum
    });
    
    // Clear existing timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && socket.connected) {
        socket.emit('stop_typing', {
          chatId: chatIdNum,
          userId: null,
          hostelOwnerId: userIdNum
        });
      }
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Online': return 'bg-green-500';
      case 'Away': return 'bg-yellow-500';
      case 'Offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChatList = () => {
    setShowChatList(!showChatList);
  };

  const selectChat = (chatId) => {
    setSelectedChatId(chatId);
    // If a different chat is selected, leave the previous chat room
    if (socket && socket.connected && selectedChatId && selectedChatId !== chatId) {
      socket.emit('leave_chat', parseInt(selectedChatId));
    }
    loadMessages(chatId);
    if (isMobile) setShowChatList(false);
  };

  // Get selected chat data
  const selectedChatData = chats.find(chat => chat.id === selectedChatId) || {};

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

  // Format date for message groups
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      {/* Sidebar Component */}
      <OwnerNav onCollapseChange={handleSidebarCollapse} />
      
      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Topbar />
        
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
        
        {/* Chat Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat List - Conditionally shown on mobile */}
          {showChatList && (
            <div className={`${isMobile ? 'absolute inset-0 z-10' : 'w-80'} bg-gray-800 border-r border-gray-700 flex flex-col`}>
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Conversations</h1>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700">
                    <Plus className="h-5 w-5" />
                  </button>
                  {isMobile && (
                    <button 
                      className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700 md:hidden"
                      onClick={toggleChatList}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-3 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search conversations" 
                    className="w-full bg-gray-700 text-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 border border-gray-600"
                  />
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                {loading ? (
                  <div className="flex justify-center items-center p-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300"></div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center p-10 text-gray-400">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div 
                      key={chat.id}
                      className={`flex items-center p-3 border-b border-gray-700 cursor-pointer transition-colors duration-200 hover:bg-gray-700 ${selectedChatId === chat.id ? 'bg-gray-700' : ''}`}
                      onClick={() => selectChat(chat.id)}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                          {chat.avatar}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(chat.status)} rounded-full border-2 border-gray-800`}></span>
                      </div>
                      <div className="ml-3 flex-grow min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-medium text-gray-200 truncate">{chat.name}</h3>
                          <span className="text-xs text-gray-400 flex-shrink-0">{chat.time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-400 truncate pr-3">{chat.lastMessage}</p>
                          {chat.unread > 0 && (
                            <span className="bg-gray-700 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Chat Window */}
          <div className="flex-grow flex flex-col bg-gray-900">
            {/* Chat Header */}
            {selectedChatId ? (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center">
                  {isMobile && !showChatList && (
                    <button 
                      className="text-gray-300 hover:text-white mr-2 p-1 rounded-full hover:bg-gray-700"
                      onClick={toggleChatList}
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  )}
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedChatData.avatar}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(selectedChatData.status)} rounded-full border-2 border-gray-800`}></span>
                  </div>
                  <div className="ml-3">
                    <h2 className="font-semibold text-white">{selectedChatData.name}</h2>
                    <p className="text-xs text-gray-400">
                      {typing ? 'Typing...' : selectedChatData.status}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button className="text-gray-300 hover:text-gray-100 p-1 rounded-full hover:bg-gray-700">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="text-gray-300 hover:text-gray-100 p-1 rounded-full hover:bg-gray-700">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="text-gray-300 hover:text-gray-100 p-1 rounded-full hover:bg-gray-700">
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center">
                  {isMobile && !showChatList && (
                    <button 
                      className="text-gray-300 hover:text-white mr-2 p-1 rounded-full hover:bg-gray-700"
                      onClick={toggleChatList}
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  )}
                  <h2 className="font-semibold text-white">Select a conversation</h2>
                </div>
              </div>
            )}
            
            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700">
              {loadingMessages ? (
                <div className="flex justify-center items-center p-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300"></div>
                </div>
              ) : selectedChatId ? (
                <>
                  {groupMessagesByDate().map((group, groupIndex) => (
                    <div key={groupIndex} className="mb-6">
                      <div className="flex justify-center mb-4">
                        <span className="px-4 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">
                          {group.displayDate}
                        </span>
                      </div>
                      {group.messages.map((message, index) => (
                        <div
                          key={message.id || index}
                          className={`flex mb-4 ${message.isUser ? 'justify-start' : 'justify-end'}`}
                        >
                          {message.isUser && (
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium mr-2 flex-shrink-0 self-end">
                              {selectedChatData.avatar}
                            </div>
                          )}
                          <div
                            className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                              message.isUser
                                ? 'bg-gray-700 text-gray-200'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            <p className="break-words">{message.text}</p>
                            <div className="flex justify-end items-center mt-1">
                              <span className="text-xs opacity-70">{message.time}</span>
                              {!message.isUser && (
                                <span className="ml-1 text-xs">
                                  {message.isRead ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          {!message.isUser && (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium ml-2 flex-shrink-0 self-end">
                              {user?.name?.charAt(0) || 'O'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                  <p className="text-center max-w-sm">
                    Select a conversation from the list to view messages
                  </p>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            {selectedChatId && (
              <div className="p-3 border-t border-gray-700 bg-gray-800">
                <div className="flex items-end">
                  <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700 mr-1">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-grow relative bg-gray-700 rounded-lg overflow-hidden">
                    <textarea
                      className="w-full bg-transparent text-gray-200 border-none resize-none p-3 pr-16 focus:outline-none max-h-32 scrollbar-thin scrollbar-thumb-gray-600"
                      placeholder="Type a message..."
                      rows={1}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={handleKeyPress}
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    ></textarea>
                    <button
                      className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700 ml-1">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;