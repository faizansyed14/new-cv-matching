import React from 'react';
import { X, Download } from 'lucide-react';
import { viewDocument } from '../utils/api';
import './DocumentViewer.css';

const DocumentViewer = ({ document, onClose }) => {
    const fileUrl = viewDocument(document.id);
    const isPDF = document.filename.toLowerCase().endsWith('.pdf');
    const isDOCX = document.filename.toLowerCase().endsWith('.docx');

    return (
        <div className="document-viewer-overlay" onClick={onClose}>
            <div className="document-viewer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="viewer-header">
                    <div className="viewer-title">
                        <h3>{document.filename}</h3>
                        <span className="badge badge-primary">{document.category}</span>
                    </div>

                    <div className="viewer-actions">
                        <a
                            href={fileUrl}
                            download={document.filename}
                            className="btn-icon"
                            title="Download"
                        >
                            <Download size={20} />
                        </a>
                        <button className="btn-icon" onClick={onClose} title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="viewer-content">
                    {isPDF ? (
                        <iframe
                            src={fileUrl}
                            title={document.filename}
                            className="pdf-viewer"
                        />
                    ) : isDOCX ? (
                        <div className="docx-viewer">
                            <div className="docx-notice">
                                <p>DOCX preview is not available in browser.</p>
                                <a
                                    href={fileUrl}
                                    download={document.filename}
                                    className="btn btn-primary"
                                >
                                    <Download size={20} />
                                    Download to View
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="unsupported-format">
                            <p>Preview not available for this file type.</p>
                            <a
                                href={fileUrl}
                                download={document.filename}
                                className="btn btn-primary"
                            >
                                <Download size={20} />
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
