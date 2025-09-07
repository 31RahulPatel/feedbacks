import React, { useState } from 'react';
import { adminAPI } from '../../utils/api';
import './SessionUpload.css';

const SessionUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await adminAPI.uploadSessions(formData);
      setMessage(response.data.message);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-upload">
      <h3>Upload Sessions</h3>
      
      <form onSubmit={handleUpload} className="upload-form">
        <div className="form-group">
          <label className="form-label">Select CSV or Excel file</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="file-input"
          />
          {file && <p className="file-name">Selected: {file.name}</p>}
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Upload Sessions'}
        </button>
      </form>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-info">
        <h4>File Format Requirements:</h4>
        <p>CSV/Excel file should contain columns: <strong>sessionId, title, speakers, time, room, track</strong></p>
        <div className="format-example">
          <strong>Example:</strong><br/>
          sessionId,title,speakers,time,room,track<br/>
          ACD101,AWS Basics,John Doe,10:00 AM,Hall A,Beginner<br/>
          ACD102,Serverless,Jane Smith,11:00 AM,Hall B,Advanced
        </div>
      </div>
    </div>
  );
};

export default SessionUpload;