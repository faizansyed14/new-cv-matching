import React, { useState, useEffect } from 'react';
import { Folder, FileText, Eye, Trash2, Search, Filter } from 'lucide-react';
import { getDocuments, getCategories, deleteDocument } from '../utils/api';
import DocumentViewer from './DocumentViewer';
import './DatabaseView.css';

const DatabaseView = () => {
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedType, setSelectedType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingDocument, setViewingDocument] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [selectedCategory, selectedType]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docsData, catsData] = await Promise.all([
                getDocuments(
                    selectedType === 'all' ? null : selectedType,
                    selectedCategory
                ),
                getCategories()
            ]);

            setDocuments(docsData.documents || []);
            setCategories(catsData.categories || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await deleteDocument(id);
                loadData();
            } catch (error) {
                console.error('Error deleting document:', error);
                alert('Failed to delete document');
            }
        }
    };

    const filteredDocuments = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
        if (!acc[doc.category]) {
            acc[doc.category] = [];
        }
        acc[doc.category].push(doc);
        return acc;
    }, {});

    return (
        <div className="database-view">
            <div className="database-header">
                <h2>Document Database</h2>

                <div className="filters">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input"
                        />
                    </div>

                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedType('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${selectedType === 'cv' ? 'active' : ''}`}
                            onClick={() => setSelectedType('cv')}
                        >
                            CVs
                        </button>
                        <button
                            className={`filter-btn ${selectedType === 'jd' ? 'active' : ''}`}
                            onClick={() => setSelectedType('jd')}
                        >
                            JDs
                        </button>
                    </div>
                </div>
            </div>

            <div className="database-content">
                {/* Categories Sidebar */}
                <div className="categories-sidebar glass-card">
                    <h3>Categories</h3>
                    <div className="category-list">
                        <button
                            className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            <Folder size={18} />
                            <span>All Categories</span>
                            <span className="count">
                                {categories.reduce((sum, cat) => sum + cat.total, 0)}
                            </span>
                        </button>

                        {categories.map((category) => (
                            <button
                                key={category.name}
                                className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category.name)}
                            >
                                <Folder size={18} />
                                <span>{category.name}</span>
                                <span className="count">{category.total}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Documents Grid */}
                <div className="documents-area">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading documents...</p>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={64} />
                            <h3>No documents found</h3>
                            <p>Upload some CVs or JDs to get started</p>
                        </div>
                    ) : (
                        Object.entries(groupedDocuments).map(([category, docs]) => (
                            <div key={category} className="category-section">
                                <div className="category-header">
                                    <Folder size={20} />
                                    <h3>{category}</h3>
                                    <span className="badge badge-primary">{docs.length}</span>
                                </div>

                                <div className="documents-grid">
                                    {docs.map((doc) => (
                                        <div key={doc.id} className="document-card glass-card">
                                            <div className="doc-icon">
                                                <FileText size={32} />
                                                <span className={`doc-type-badge badge ${doc.file_type === 'cv' ? 'badge-success' : 'badge-warning'}`}>
                                                    {doc.file_type.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="doc-info">
                                                <h4 className="doc-name">{doc.filename}</h4>
                                                <p className="doc-meta">
                                                    {new Date(doc.upload_date).toLocaleDateString()}
                                                </p>
                                                <p className="doc-meta">
                                                    {(doc.file_size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>

                                            <div className="doc-actions">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => setViewingDocument(doc)}
                                                    title="View document"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(doc.id)}
                                                    title="Delete document"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Document Viewer Modal */}
            {viewingDocument && (
                <DocumentViewer
                    document={viewingDocument}
                    onClose={() => setViewingDocument(null)}
                />
            )}
        </div>
    );
};

export default DatabaseView;
