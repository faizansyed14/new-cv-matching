import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, Loader, Zap } from 'lucide-react';
import { uploadCVs, uploadJD, matchCVsToJD, getDocuments } from '../utils/api';
import './UploadSection.css';

const UploadSection = ({ onUploadComplete, onSwitchToMatch }) => {
    const [cvFiles, setCvFiles] = useState([]);
    const [jdFile, setJdFile] = useState(null);
    const [uploadingCV, setUploadingCV] = useState(false);
    const [uploadingJD, setUploadingJD] = useState(false);
    const [cvUploadResults, setCvUploadResults] = useState(null);
    const [jdUploadResults, setJdUploadResults] = useState(null);
    const [lastUploadedJD, setLastUploadedJD] = useState(null);
    const [matching, setMatching] = useState(false);

    const onCVDrop = (acceptedFiles) => {
        setCvFiles(prev => [...prev, ...acceptedFiles]);
    };

    const onJDDrop = (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setJdFile(acceptedFiles[0]);
        }
    };

    const { getRootProps: getCVRootProps, getInputProps: getCVInputProps, isDragActive: isCVDragActive } = useDropzone({
        onDrop: onCVDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        multiple: true,
    });

    const { getRootProps: getJDRootProps, getInputProps: getJDInputProps, isDragActive: isJDDragActive } = useDropzone({
        onDrop: onJDDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        multiple: false,
    });

    const handleUploadCVs = async () => {
        if (cvFiles.length === 0) return;

        setUploadingCV(true);

        try {
            const result = await uploadCVs(cvFiles);
            setCvUploadResults(result);

            setTimeout(() => {
                setCvFiles([]);
                if (onUploadComplete) onUploadComplete();
            }, 5000);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading CVs. Please try again.');
        } finally {
            setUploadingCV(false);
        }
    };

    const handleUploadJD = async () => {
        if (!jdFile) return;

        setUploadingJD(true);

        try {
            const result = await uploadJD(jdFile);
            setJdUploadResults({ uploaded: 1, results: [result], errors: [] });
            setLastUploadedJD(result.id);

            setTimeout(() => {
                setJdFile(null);
                if (onUploadComplete) onUploadComplete();
            }, 5000);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading JD. Please try again.');
        } finally {
            setUploadingJD(false);
        }
    };

    const handleQuickMatch = async () => {
        if (!lastUploadedJD) {
            alert('Please upload a JD first');
            return;
        }

        setMatching(true);
        try {
            await matchCVsToJD(lastUploadedJD);
            // Switch to match tab to show results
            if (onSwitchToMatch) {
                onSwitchToMatch();
            }
        } catch (error) {
            console.error('Matching error:', error);
            alert('Error matching CVs. Please try the Match tab.');
        } finally {
            setMatching(false);
        }
    };

    const removeCVFile = (index) => {
        setCvFiles(prev => prev.filter((_, i) => i !== index));
    };

    const canQuickMatch = cvUploadResults && jdUploadResults && lastUploadedJD;

    return (
        <div className="upload-section">
            <h2 className="section-title">Upload Documents</h2>

            <div className="upload-grid">
                {/* CV Upload */}
                <div className="upload-card glass-card">
                    <h3>Upload CVs</h3>
                    <p className="upload-subtitle">Upload up to 60 CVs at once</p>

                    <div
                        {...getCVRootProps()}
                        className={`dropzone ${isCVDragActive ? 'active' : ''}`}
                    >
                        <input {...getCVInputProps()} />
                        <Upload size={48} />
                        <p>Drag & drop CVs here, or click to select</p>
                        <span className="file-types">PDF, DOCX</span>
                    </div>

                    {cvFiles.length > 0 && (
                        <div className="file-list">
                            <h4>{cvFiles.length} file(s) selected</h4>
                            {cvFiles.slice(0, 5).map((file, index) => (
                                <div key={index} className="file-item">
                                    <FileText size={16} />
                                    <span>{file.name}</span>
                                    <button onClick={() => removeCVFile(index)} className="remove-btn">
                                        <XCircle size={16} />
                                    </button>
                                </div>
                            ))}
                            {cvFiles.length > 5 && (
                                <p className="more-files">+{cvFiles.length - 5} more files</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleUploadCVs}
                        disabled={cvFiles.length === 0 || uploadingCV}
                        className="btn btn-primary upload-btn"
                    >
                        {uploadingCV ? (
                            <>
                                <Loader className="spinner-icon" size={20} />
                                Uploading CVs...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Upload CVs
                            </>
                        )}
                    </button>
                </div>

                {/* JD Upload */}
                <div className="upload-card glass-card">
                    <h3>Upload Job Description</h3>
                    <p className="upload-subtitle">Upload a single JD file</p>

                    <div
                        {...getJDRootProps()}
                        className={`dropzone ${isJDDragActive ? 'active' : ''}`}
                    >
                        <input {...getJDInputProps()} />
                        <Upload size={48} />
                        <p>Drag & drop JD here, or click to select</p>
                        <span className="file-types">PDF, DOCX</span>
                    </div>

                    {jdFile && (
                        <div className="file-list">
                            <div className="file-item">
                                <FileText size={16} />
                                <span>{jdFile.name}</span>
                                <button onClick={() => setJdFile(null)} className="remove-btn">
                                    <XCircle size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleUploadJD}
                        disabled={!jdFile || uploadingJD}
                        className="btn btn-primary upload-btn"
                    >
                        {uploadingJD ? (
                            <>
                                <Loader className="spinner-icon" size={20} />
                                Uploading JD...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Upload JD
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* CV Upload Results */}
            {cvUploadResults && (
                <div className="upload-results glass-card fade-in">
                    <div className="results-header">
                        <CheckCircle size={24} className="success-icon" />
                        <h3>CV Upload Complete!</h3>
                    </div>
                    <div className="results-stats">
                        <div className="stat">
                            <span className="stat-value">{cvUploadResults.uploaded}</span>
                            <span className="stat-label">CVs Uploaded</span>
                        </div>
                        {cvUploadResults.failed > 0 && (
                            <div className="stat error">
                                <span className="stat-value">{cvUploadResults.failed}</span>
                                <span className="stat-label">Failed</span>
                            </div>
                        )}
                    </div>

                    {cvUploadResults.results && cvUploadResults.results.length > 0 && (
                        <div className="categorized-files">
                            {cvUploadResults.results.slice(0, 3).map((result, index) => (
                                <div key={index} className="category-badge">
                                    <span className="badge badge-primary">{result.category}</span>
                                    <span className="filename">{result.filename}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* JD Upload Results */}
            {jdUploadResults && (
                <div className="upload-results glass-card fade-in">
                    <div className="results-header">
                        <CheckCircle size={24} className="success-icon" />
                        <h3>JD Upload Complete!</h3>
                    </div>
                    <div className="results-stats">
                        <div className="stat">
                            <span className="stat-value">1</span>
                            <span className="stat-label">JD Uploaded</span>
                        </div>
                    </div>

                    {jdUploadResults.results && jdUploadResults.results.length > 0 && (
                        <div className="categorized-files">
                            {jdUploadResults.results.map((result, index) => (
                                <div key={index} className="category-badge">
                                    <span className="badge badge-success">{result.category}</span>
                                    <span className="filename">{result.filename}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Quick Match Button */}
            {canQuickMatch && (
                <div className="quick-match-section glass-card fade-in">
                    <div className="quick-match-content">
                        <Zap size={32} className="match-icon" />
                        <div className="match-text">
                            <h3>Ready to Match!</h3>
                            <p>Click below to match your uploaded CVs against the JD</p>
                        </div>
                    </div>
                    <button
                        onClick={handleQuickMatch}
                        disabled={matching}
                        className="btn btn-primary quick-match-btn"
                    >
                        {matching ? (
                            <>
                                <Loader className="spinner-icon" size={20} />
                                Matching...
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                Match Now
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UploadSection;
