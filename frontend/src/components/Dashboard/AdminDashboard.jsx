import React, { useState, useEffect } from 'react';
import { adminAPI, jobAPI } from '../../utils/api';
import AdminUpload from '../AdminUpload/AdminUpload';
import SessionUpload from '../SessionUpload/SessionUpload';
import AdminReports from '../AdminReports/AdminReports';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('All');
  const [jobs, setJobs] = useState([]);

  const [jobApplications, setJobApplications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    experience: '',
    skills: '',
    description: ''
  });
  const [newSession, setNewSession] = useState({
    sessionId: '',
    title: '',
    speaker: '',
    time: '',
    room: '',
    track: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    } else if (activeTab === 'jobs') {
      loadJobs();
      loadJobApplications();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    try {
      const response = await adminAPI.getSessions();
      setSessions(response.data);
      setFilteredSessions(response.data);
    } catch (error) {
      setError('Failed to load sessions');
    }
  };

  const getFilteredSessions = () => {
    if (selectedTrack === 'All') return sessions;
    if (selectedTrack === 'General') {
      return sessions.filter(s => !s.track || s.track === 'General' || s.track === '');
    }
    return sessions.filter(s => s.track === selectedTrack);
  };

  const getTracks = () => {
    const tracks = ['All', 'General'];
    const uniqueTracks = [...new Set(sessions.map(s => s.track).filter(t => t && t !== 'General'))];
    return [...tracks, ...uniqueTracks];
  };

  const loadJobs = async () => {
    try {
      const response = await jobAPI.getJobs();
      setJobs(response.data);
    } catch (error) {
      setError('Failed to load jobs');
    }
  };



  const loadJobApplications = async () => {
    try {
      const response = await jobAPI.getApplications();
      setJobApplications(response.data);
    } catch (error) {
      setError('Failed to load job applications');
    }
  };

  const handleInputChange = (e) => {
    setNewSession({
      ...newSession,
      [e.target.name]: e.target.value
    });
  };

  const handleJobInputChange = (e) => {
    setNewJob({
      ...newJob,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await adminAPI.createSession(newSession);
      setMessage('Session created successfully');
      setNewSession({
        sessionId: '',
        title: '',
        speaker: '',
        time: '',
        room: '',
        track: ''
      });
      loadSessions();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await jobAPI.createJob(newJob);
      setMessage('Job created successfully');
      setNewJob({
        title: '',
        company: '',
        location: '',
        experience: '',
        skills: '',
        description: ''
      });
      loadJobs();
    } catch (error) {
      setError('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleJobCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await jobAPI.uploadJobsCSV(formData);
      setMessage(response.data.message);
      loadJobs();
    } catch (error) {
      setError('Failed to upload jobs CSV');
    } finally {
      setLoading(false);
    }
  };



  const exportJobs = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const csvContent = 'Title,Company,Location,Experience\n' +
      jobs.map(j => `"${j.title}","${j.company}","${j.location}","${j.experience}"`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-export-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };



  const exportJobApplications = async () => {
    try {
      const response = await jobAPI.exportApplications();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-applications-${timestamp}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export applications');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sessions':
        return (
          <div className="sessions-tab">
            <div className="create-session-form">
              <h3>Create New Session</h3>
              <form onSubmit={handleCreateSession}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Session ID</label>
                    <input
                      type="text"
                      name="sessionId"
                      value={newSession.sessionId}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={newSession.title}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Speaker</label>
                    <input
                      type="text"
                      name="speaker"
                      value={newSession.speaker}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="text"
                      name="time"
                      value={newSession.time}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 10:00 AM - 11:00 AM"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Room</label>
                    <input
                      type="text"
                      name="room"
                      value={newSession.room}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Track</label>
                    <input
                      type="text"
                      name="track"
                      value={newSession.track}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
              </form>
              
              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="sessions-list">
              <h3>Existing Sessions ({getFilteredSessions().length})</h3>
              
              <div className="track-filter">
                <div className="track-buttons">
                  {getTracks().map(track => (
                    <button
                      key={track}
                      className={`track-btn ${selectedTrack === track ? 'active' : ''}`}
                      onClick={() => setSelectedTrack(track)}
                    >
                      {track}
                    </button>
                  ))}
                </div>
              </div>
              
              {getFilteredSessions().length === 0 ? (
                <p>No sessions available for {selectedTrack}</p>
              ) : (
                <div className="sessions-grid">
                  {getFilteredSessions().map((session) => (
                    <div key={session.sessionId} className="session-item">
                      <h4>{session.title}</h4>
                      <p><strong>Speaker:</strong> {session.speaker}</p>
                      <p><strong>Time:</strong> {session.time}</p>
                      <p><strong>Room:</strong> {session.room}</p>
                      <p><strong>Track:</strong> {session.track}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'jobs':
        return (
          <div className="jobs-tab">
            <div className="create-job-form">
              <h3>Create New Job</h3>
              <form onSubmit={handleCreateJob}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      name="title"
                      value={newJob.title}
                      onChange={handleJobInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={newJob.company}
                      onChange={handleJobInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={newJob.location}
                      onChange={handleJobInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience Required</label>
                    <input
                      type="text"
                      name="experience"
                      value={newJob.experience}
                      onChange={handleJobInputChange}
                      className="form-input"
                      placeholder="e.g., 2-4 years"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Required Skills</label>
                  <input
                    type="text"
                    name="skills"
                    value={newJob.skills}
                    onChange={handleJobInputChange}
                    className="form-input"
                    placeholder="e.g., AWS, React, Node.js"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Job Description</label>
                  <textarea
                    name="description"
                    value={newJob.description}
                    onChange={handleJobInputChange}
                    className="form-textarea"
                    rows="3"
                    required
                  />
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Job'}
                </button>
              </form>
            </div>

            <div className="csv-upload-section">
              <h3>Upload Jobs via CSV</h3>
              <input
                type="file"
                accept=".csv"
                onChange={handleJobCSVUpload}
                className="file-input"
              />
              <p className="csv-format">CSV Format: title,company,location,experience,skills,description</p>
            </div>

            <div className="jobs-list">
              <div className="list-header">
                <h3>Posted Jobs ({jobs.length})</h3>
                <button 
                  className="btn btn-secondary" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    exportJobs();
                  }}
                  type="button"
                >
                  Download CSV
                </button>
              </div>
              {jobs.length === 0 ? (
                <p>No jobs posted yet</p>
              ) : (
                <div className="data-grid">
                  {jobs.map((job) => (
                    <div key={job._id} className="data-item">
                      <h4>{job.title}</h4>
                      <p><strong>Company:</strong> {job.company}</p>
                      <p><strong>Location:</strong> {job.location}</p>
                      <p><strong>Experience:</strong> {job.experience}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>



            <div className="applications-list">
              <div className="list-header">
                <h3>Job Applications ({jobApplications.length})</h3>
                <button 
                  className="btn btn-secondary" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    exportJobApplications();
                  }}
                  type="button"
                >
                  Download CSV
                </button>
              </div>
              {jobApplications.length === 0 ? (
                <p>No job applications received yet</p>
              ) : (
                <div className="data-grid">
                  {jobApplications.map((application) => (
                    <div key={application._id} className="data-item">
                      <h4>{application.name}</h4>
                      <p><strong>Job:</strong> {application.jobTitle} at {application.company}</p>
                      <p><strong>Email:</strong> {application.userEmail}</p>
                      <p><strong>Phone:</strong> {application.phone}</p>
                      <p><strong>Resume:</strong> {application.resumeFile}</p>
                      <p><strong>Applied:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'upload':
        return (
          <div>
            <AdminUpload />
            <SessionUpload onUploadSuccess={loadSessions} />
          </div>
        );
      
      case 'reports':
        return <AdminReports />;
      
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-brand">
              <h1>AWS UG Vadodara<br />Admin Panel</h1>
              <p className="subtitle">Community Day Management</p>
            </div>
            <div className="header-right">
              <div className={`header-actions ${menuOpen ? 'open' : ''}`}>
                <button className="btn btn-secondary" onClick={onLogout}>
                  Logout
                </button>
              </div>
              <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </button>
          <button
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Data
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AWS User Group Vadodara</h4>
              <div className="footer-links">
                <a href="https://www.linkedin.com/company/aws-user-group-vadodara" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://awsugvadodara.com" target="_blank" rel="noopener noreferrer">Official Website</a>
              </div>
            </div>
            <div className="footer-section">
              <p>Thank you for being part of our community!</p>
              <p>Made for AWS UG Community</p>
              <p>© 2025 AWS User Group Vadodara</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;