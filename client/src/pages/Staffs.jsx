import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, MoreVertical, X, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import OwnerNav from '../components/OwnerNav';
import Topbar from '../components/Topbar';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('All Staff');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const tabs = ['All Staff', 'Housekeeping', 'Reception', 'Maintenance', 'Kitchen', 'Security'];
  
  // API data state
  const [staffData, setStaffData] = useState([]);
  const [staffStats, setStaffStats] = useState({
    totalStaff: 0,
    onDutyStaff: 0,
    onLeaveStaff: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Handle sidebar collapse state
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };
  
  // Add Staff form state
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null); // For edit mode
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'RECEPTION',
    shift: 'MORNING',
    status: 'ON_DUTY',
    contact: '',
    email: ''
  });
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: ''
  });

  // Fetch staff data on component mount
  useEffect(() => {
    fetchStaffData();
    fetchStaffStats();
  }, []);

  // Fetch staff data from API
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Token');
      const response = await axios.get('http://localhost:8870/staff/getStaff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStaffData(response.data.staff);
      } else {
        setError(response.data.message || 'Failed to fetch staff data');
        toast.error('Failed to fetch staff data');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      setError(error.response?.data?.message || 'Failed to fetch staff data');
      setLoading(false);
      toast.error('Failed to fetch staff data');
    }
  };

  // Fetch staff statistics from API
  const fetchStaffStats = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axios.get('http://localhost:8870/staff/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStaffStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching staff statistics:', error);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff({
      ...newStaff,
      [name]: value
    });
  };

  // Format form data for API submission
  const prepareFormData = () => {
    const formData = new FormData();
    formData.append('name', newStaff.name);
    formData.append('role', newStaff.role);
    formData.append('shift', newStaff.shift);
    formData.append('status', newStaff.status);
    formData.append('contact', newStaff.contact);
    
    if (newStaff.email) {
      formData.append('email', newStaff.email);
    }
    
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }
    
    return formData;
  };

  // Handle staff creation
  const createNewStaff = async (formData) => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axios.post('http://localhost:8870/staff/addStaff', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Add new staff to the list
        setStaffData([response.data.staff, ...staffData]);
        // Update stats
        fetchStaffStats();
        
        // Show success notification
        setNotification({
          show: true,
          message: 'Staff added successfully!',
          type: 'success'
        });
        
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
        
        return true;
      } else {
        setNotification({
          show: true,
          message: response.data.message || 'Failed to add staff',
          type: 'error'
        });
        
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
        
        return false;
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      setNotification({
        show: true,
        message: error.response?.data?.message || 'Failed to add staff',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      
      return false;
    }
  };

  // Handle staff update
  const updateExistingStaff = async (staffId, formData) => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axios.put(`http://localhost:8870/staff/${staffId}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Update staff in the list
        setStaffData(staffData.map(staff => 
          staff.id === staffId ? response.data.staff : staff
        ));
        
        // Update stats
        fetchStaffStats();
        
        // Show success notification
        setNotification({
          show: true,
          message: 'Staff updated successfully!',
          type: 'success'
        });
        
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
        
        return true;
      } else {
        setNotification({
          show: true,
          message: response.data.message || 'Failed to update staff',
          type: 'error'
        });
        
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
        
        return false;
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      setNotification({
        show: true,
        message: error.response?.data?.message || 'Failed to update staff',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      
      return false;
    }
  };

  // Handle staff deletion
  const deleteStaffMember = async (staffId) => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axios.delete(`http://localhost:8870/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Remove staff from the list
        setStaffData(staffData.filter(staff => staff.id !== staffId));
        
        // Update stats
        fetchStaffStats();
        
        // Show success notification
        setNotification({
          show: true,
          message: 'Staff deleted successfully!',
          type: 'success'
        });
        
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
      } else {
        setNotification({
          show: true,
          message: response.data.message || 'Failed to delete staff',
          type: 'error'
        });
        
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      setNotification({
        show: true,
        message: error.response?.data?.message || 'Failed to delete staff',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  // Handle staff form submission (create or update)
  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newStaff.name || !newStaff.contact) {
      setNotification({
        show: true,
        message: 'Please fill in all required fields',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      
      return;
    }
    
    const formData = prepareFormData();
    let success = false;
    
    if (editingStaff) {
      // Update existing staff
      success = await updateExistingStaff(editingStaff.id, formData);
    } else {
      // Create new staff
      success = await createNewStaff(formData);
    }
    
    if (success) {
      // Reset form
      setNewStaff({
        name: '',
        role: 'RECEPTION',
        shift: 'MORNING',
        status: 'ON_DUTY',
        contact: '',
        email: ''
      });
      setSelectedFile(null);
      setEditingStaff(null);
      
      // Close form
      setShowAddStaffForm(false);
    }
  };

  // Open edit form with staff data
  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setNewStaff({
      name: staff.name,
      role: staff.role,
      shift: staff.shift,
      status: staff.status,
      contact: staff.contact,
      email: staff.email || ''
    });
    setShowAddStaffForm(true);
  };

  // Handle delete confirmation
  const handleDeleteStaff = (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteStaffMember(staffId);
    }
  };

  // Reset form and close modal
  const handleCancelForm = () => {
    setNewStaff({
      name: '',
      role: 'RECEPTION',
      shift: 'MORNING',
      status: 'ON_DUTY',
      contact: '',
      email: ''
    });
    setSelectedFile(null);
    setEditingStaff(null);
    setShowAddStaffForm(false);
  };

  // Filter staff based on active tab and search query
  const filteredStaff = staffData
    .filter(staff => activeTab === 'All Staff' || staff.role === activeTab.toUpperCase())
    .filter(staff => 
      searchQuery === '' || 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.contact.includes(searchQuery)
    );

  // Display staff role in a user-friendly format
  const formatRole = (role) => {
    return role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ');
  };

  // Display staff shift in a user-friendly format
  const formatShift = (shift) => {
    return shift.charAt(0) + shift.slice(1).toLowerCase();
  };

  // Display staff status in a user-friendly format
  const formatStatus = (status) => {
    return status === 'ON_DUTY' ? 'On Duty' : 'On Leave';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_DUTY': return 'bg-green-900/50 text-green-400 border border-green-700/30';
      case 'ON_LEAVE': return 'bg-orange-900/50 text-orange-400 border border-orange-700/30';
      default: return 'bg-gray-800 text-gray-400 border border-gray-700';
    }
  };
  
  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate random background color for staff avatar
  const getAvatarBgColor = (id) => {
    const colors = [
      'bg-blue-600', 'bg-purple-600', 'bg-red-600', 'bg-green-600', 
      'bg-yellow-600', 'bg-pink-600', 'bg-indigo-600', 'bg-teal-600'
    ];
    return colors[id % colors.length] || 'bg-gray-600';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <OwnerNav onCollapseChange={handleSidebarCollapse} />
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Topbar />
        
        {/* Main content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <button 
                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => {
                  setEditingStaff(null);
                  setNewStaff({
                    name: '',
                    role: 'RECEPTION',
                    shift: 'MORNING',
                    status: 'ON_DUTY',
                    contact: '',
                    email: ''
                  });
                  setShowAddStaffForm(true);
                }}
              >
                <Plus size={18} />
                Add Staff
              </button>
            </div>
            
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-4 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-gray-400 text-sm mb-1">Total Staff</h3>
              <div className="text-2xl font-bold text-white">{staffStats.totalStaff}</div>
              <div className="w-full h-1 bg-blue-600 mt-2 rounded-full"></div>
            </div>
            
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-gray-400 text-sm mb-1">On Duty</h3>
              <div className="text-2xl font-bold text-white">{staffStats.onDutyStaff}</div>
              <div className="w-full h-1 bg-green-600 mt-2 rounded-full"></div>
            </div>
            
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-gray-400 text-sm mb-1">On Leave</h3>
              <div className="text-2xl font-bold text-white">{staffStats.onLeaveStaff}</div>
              <div className="w-full h-1 bg-orange-500 mt-2 rounded-full"></div>
            </div>
          </div>
          
          {/* Tabs and Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`py-3 px-6 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab 
                      ? 'text-orange-400 border-b-2 border-orange-500' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Loading state */}
            {loading && (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading staff data...</p>
              </div>
            )}
            
            {/* Error state */}
            {!loading && error && (
              <div className="p-12 text-center">
                <div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded-lg inline-block">
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            {/* Table */}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-700 bg-gray-900/50">
                      <th className="py-3 px-4 font-medium text-gray-300">Staff</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Name</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Role</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Shift</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Status</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Contact</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((staff) => (
                        <tr key={staff.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                          <td className="py-3 px-4">
                            {staff.photo ? (
                              <img 
                                src={staff.photo} 
                                alt={staff.name} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full ${getAvatarBgColor(staff.id)} text-white flex items-center justify-center`}>
                                {getInitials(staff.name)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-200">{staff.name}</td>
                          <td className="py-3 px-4 text-gray-200">{formatRole(staff.role)}</td>
                          <td className="py-3 px-4 text-gray-200">{formatShift(staff.shift)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(staff.status)}`}>
                              {formatStatus(staff.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-200">{staff.contact}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button 
                                className="text-blue-400 hover:text-blue-300 p-1 hover:bg-gray-700 rounded-full transition-colors"
                                onClick={() => handleEditStaff(staff)}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-700 rounded-full transition-colors"
                                onClick={() => handleDeleteStaff(staff.id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button 
                                className="text-gray-400 hover:text-gray-300 p-1 hover:bg-gray-700 rounded-full transition-colors"
                                title="More options"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400">
                          No staff members found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Add/Edit Staff Form Modal */}
        {showAddStaffForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
                </h2>
                <button 
                  className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-full transition-colors"
                  onClick={handleCancelForm}
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmitStaff}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newStaff.name}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={newStaff.role}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                    >
                      <option value="RECEPTION">Reception</option>
                      <option value="HOUSEKEEPING">Housekeeping</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="KITCHEN">Kitchen</option>
                      <option value="SECURITY">Security</option>
                      <option value="MANAGER">Manager</option>
                      <option value="WARDEN">Warden</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Shift
                    </label>
                    <select
                      name="shift"
                      value={newStaff.shift}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                    >
                      <option value="MORNING">Morning</option>
                      <option value="EVENING">Evening</option>
                      <option value="NIGHT">Night</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={newStaff.status}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                    >
                      <option value="ON_DUTY">On Duty</option>
                      <option value="ON_LEAVE">On Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Contact Number*
                    </label>
                    <input
                      type="text"
                      name="contact"
                      value={newStaff.contact}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newStaff.email}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Notification */}
        {notification.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-800 text-white border border-green-600' :
            notification.type === 'error' ? 'bg-red-800 text-white border border-red-600' :
            'bg-gray-800 text-white border border-gray-600'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : 
             notification.type === 'error' ? <AlertCircle size={20} /> : null}
            <span>{notification.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;