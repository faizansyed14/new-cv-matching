import React, { useState, useEffect } from 'react';
import { Zap, Loader, TrendingUp, AlertCircle, CheckSquare, Square, Cpu, Search, Filter, Brain, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { getDocuments, matchCVsToJD } from '../utils/api';
import MatchResults from './MatchResults';
import './MatchingInterface.css';

const MatchingInterface = () => {
    const [jds, setJds] = useState([]);
    const [cvs, setCvs] = useState([]);
    const [filteredCvs, setFilteredCvs] = useState([]);
    const [selectedJD, setSelectedJD] = useState(null);
    const [selectedCVs, setSelectedCVs] = useState([]);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectAll, setSelectAll] = useState(false);
    const [matching, setMatching] = useState(false);
    const [matchResults, setMatchResults] = useState(null);
    const [error, setError] = useState(null);

    // Progress tracking states
    const [processedCount, setProcessedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [currentStage, setCurrentStage] = useState('');
    const [currentCV, setCurrentCV] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterCVs();
    }, [cvs, searchTerm, categoryFilter]);

    const loadData = async () => {
        try {
            const [jdData, cvData] = await Promise.all([
                getDocuments('jd'),
                getDocuments('cv')
            ]);

            setJds(jdData.documents || []);
            setCvs(cvData.documents || []);

            if (jdData.documents && jdData.documents.length > 0) {
                setSelectedJD(jdData.documents[0].id);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const filterCVs = () => {
        let filtered = cvs;

        if (searchTerm) {
            filtered = filtered.filter(cv =>
                cv.filename.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(cv => cv.category === categoryFilter);
        }

        setFilteredCvs(filtered);
    };

    const handleSelectCV = (cvId) => {
        setSelectedCVs(prev => {
            if (prev.includes(cvId)) {
                return prev.filter(id => id !== cvId);
            } else {
                return [...prev, cvId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedCVs([]);
        } else {
            setSelectedCVs(filteredCvs.map(cv => cv.id));
        }
        setSelectAll(!selectAll);
    };

    // Simulate progress updates
    const simulateProgress = (total) => {
        setTotalCount(total);
        setProcessedCount(0);

        const stages = [
            'Extracting CV content...',
            'Analyzing skills and experience...',
            'Comparing with job requirements...',
            'Calculating match score...',
            'Generating insights...'
        ];

        let currentProcessed = 0;
        let stageIndex = 0;

        const interval = setInterval(() => {
            if (currentProcessed < total) {
                // Update stage
                setCurrentStage(stages[stageIndex % stages.length]);
                stageIndex++;

                // Simulate processing a CV
                if (Math.random() > 0.3) {
                    currentProcessed++;
                    setProcessedCount(currentProcessed);

                    // Get CV name
                    const selectedCVsList = cvs.filter(cv => selectedCVs.includes(cv.id));
                    if (selectedCVsList[currentProcessed - 1]) {
                        setCurrentCV(selectedCVsList[currentProcessed - 1].filename);
                    }
                }
            } else {
                clearInterval(interval);
                setCurrentStage('Finalizing results...');
            }
        }, 800);

        return interval;
    };

    const handleMatch = async () => {
        if (!selectedJD) {
            setError('Please select a Job Description');
            return;
        }

        if (selectedCVs.length === 0) {
            setError('Please select at least one CV to match');
            return;
        }

        setMatching(true);
        setError(null);
        setMatchResults(null);

        // Start progress simulation
        const progressInterval = simulateProgress(selectedCVs.length);

        try {
            const results = await matchCVsToJD(selectedJD, selectedCVs, selectedModel);
            clearInterval(progressInterval);
            setProcessedCount(selectedCVs.length);
            setCurrentStage('Complete!');

            // Small delay to show completion
            setTimeout(() => {
                setMatchResults(results);
            }, 500);
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Matching error:', error);
            setError('Failed to match CVs. Please check your API connection.');
        } finally {
            setTimeout(() => {
                setMatching(false);
            }, 600);
        }
    };

    const getModelInfo = (model) => {
        const modelInfo = {
            'gpt-4o-mini': { name: 'gpt-4o-mini', badge: 'Latest', color: 'primary', icon: '🚀' },
            'gpt-4.1-mini-2025-04-14': { name: 'GPT-4.1 Mini (2025)', badge: 'Latest', color: 'primary', icon: '' },
            'gpt-4o-mini': { name: 'GPT-4o Mini', badge: 'Recommended', color: 'success', icon: '⚡' },
            'gpt-4o': { name: 'GPT-4o', badge: 'Most Accurate', color: 'primary', icon: '🎯' },
            'gpt-4-turbo': { name: 'GPT-4 Turbo', badge: 'Advanced', color: 'primary', icon: '🔥' },
            'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', badge: 'Fast', color: 'accent', icon: '💨' },
            'ollama': { name: 'Qwen 2.5:32b', badge: 'Local', color: 'warning', icon: '🏠' }
        };
        return modelInfo[model] || modelInfo['gpt-4o-mini'];
    };

    const categories = [...new Set(cvs.map(cv => cv.category))];
    const currentModelInfo = getModelInfo(selectedModel);
    const progressPercentage = totalCount > 0 ? (processedCount / totalCount) * 100 : 0;

    return (
        <div className="matching-interface">
            <div className="matching-header">
                <h2>
                    <Zap size={32} />
                    CV-JD Matching
                </h2>
                <p className="subtitle">Match selected CVs against a Job Description using AI</p>
            </div>

            <div className="matching-controls glass-card">
                {/* JD Selection */}
                <div className="control-group">
                    <label htmlFor="jd-select">📄 Select Job Description</label>
                    <select
                        id="jd-select"
                        value={selectedJD || ''}
                        onChange={(e) => setSelectedJD(Number(e.target.value))}
                        className="input select-enhanced"
                        disabled={jds.length === 0}
                    >
                        {jds.length === 0 ? (
                            <option>No JDs available</option>
                        ) : (
                            jds.map((jd) => (
                                <option key={jd.id} value={jd.id}>
                                    {jd.filename} • {jd.category}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Model Selection */}
                <div className="control-group">
                    <label htmlFor="model-select">
                        <Cpu size={18} />
                        AI Model
                    </label>
                    <select
                        id="model-select"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="input select-enhanced"
                    >
                        <optgroup label="🌟 Latest Models">
                            <option value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini (2025-04-14) - Latest</option>
                            <option value="gpt-4o-mini">🚀 gpt-4o-mini (Latest & Most Advanced)</option>
                        </optgroup>
                        <optgroup label="⚡ OpenAI Models (Recommended)">
                            <option value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini (2025-04-14) - Latest</option>
                            <option value="gpt-4o-mini">⚡ GPT-4o Mini (Fast & Accurate)</option>
                            <option value="gpt-4o">🎯 GPT-4o (Most Accurate)</option>
                            <option value="gpt-4-turbo">🔥 GPT-4 Turbo (Advanced)</option>
                            <option value="gpt-3.5-turbo">💨 GPT-3.5 Turbo (Fastest)</option>
                        </optgroup>
                        <optgroup label="🏠 Local Models">
                            <option value="ollama">🏠 Qwen 2.5:32b (Ollama)</option>
                        </optgroup>
                    </select>
                    <div className="model-info-card">
                        <span className="model-icon">{currentModelInfo.icon}</span>
                        <div className="model-details">
                            <span className="model-name">{currentModelInfo.name}</span>
                            <span className={`badge badge-${currentModelInfo.color}`}>
                                {currentModelInfo.badge}
                            </span>
                        </div>
                    </div>
                </div>

                {/* CV Selection */}
                <div className="control-group">
                    <div className="cv-selection-header">
                        <label>👥 Select CVs to Match ({selectedCVs.length} selected)</label>
                        <button
                            onClick={handleSelectAll}
                            className="btn-secondary select-all-btn"
                            disabled={filteredCvs.length === 0}
                        >
                            {selectAll ? (
                                <>
                                    <CheckSquare size={16} />
                                    Deselect All
                                </>
                            ) : (
                                <>
                                    <Square size={16} />
                                    Select All
                                </>
                            )}
                        </button>
                    </div>

                    {/* Search and Filter */}
                    <div className="cv-filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search CVs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="filter-box">
                            <Filter size={18} />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* CV Cards Grid */}
                    <div className="cv-grid">
                        {filteredCvs.length === 0 ? (
                            <p className="no-cvs">No CVs match your search criteria.</p>
                        ) : (
                            filteredCvs.map((cv) => (
                                <div
                                    key={cv.id}
                                    className={`cv-card ${selectedCVs.includes(cv.id) ? 'selected' : ''}`}
                                    onClick={() => handleSelectCV(cv.id)}
                                >
                                    <div className="cv-card-header">
                                        <div className="cv-checkbox">
                                            {selectedCVs.includes(cv.id) ? (
                                                <CheckSquare size={22} className="checked" />
                                            ) : (
                                                <Square size={22} />
                                            )}
                                        </div>
                                        <span className={`badge badge-primary cv-badge`}>{cv.category}</span>
                                    </div>
                                    <div className="cv-card-body">
                                        <h4 className="cv-title">{cv.filename}</h4>
                                        <p className="cv-meta">
                                            <span>{(cv.file_size / 1024).toFixed(1)} KB</span>
                                            <span>•</span>
                                            <span>{new Date(cv.upload_date).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <button
                    onClick={handleMatch}
                    disabled={!selectedJD || selectedCVs.length === 0 || matching || jds.length === 0}
                    className="btn btn-primary match-btn"
                >
                    {matching ? (
                        <>
                            <Loader className="spinner-icon" size={20} />
                            Matching {selectedCVs.length} CV(s) with {currentModelInfo.name}...
                        </>
                    ) : (
                        <>
                            <Zap size={20} />
                            Match {selectedCVs.length > 0 ? `${selectedCVs.length} CV(s)` : 'CVs'}
                        </>
                    )}
                </button>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="info-message">
                    <TrendingUp size={16} />
                    <span>
                        {currentModelInfo.icon} Using {currentModelInfo.name} for optimal accuracy and speed.
                    </span>
                </div>
            </div>

            {matching && (
                <div className="matching-progress glass-card fade-in">
                    <div className="progress-header">
                        <h3>
                            <Brain className="brain-icon pulse-animation" size={32} />
                            AI Analysis in Progress
                        </h3>
                        <p className="progress-subtitle">Deep learning algorithms analyzing candidates...</p>
                    </div>

                    {/* Progress Stats */}
                    <div className="progress-stats">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{processedCount}</div>
                                <div className="stat-label">Processed</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <Loader className="spinner-icon" size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{totalCount - processedCount}</div>
                                <div className="stat-label">Remaining</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <Target size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{totalCount}</div>
                                <div className="stat-label">Total CVs</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-bar-container">
                        <div className="progress-bar-header">
                            <span className="progress-text">
                                {processedCount} of {totalCount} CVs analyzed
                            </span>
                            <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill animated-gradient"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                <div className="progress-shine"></div>
                            </div>
                        </div>
                    </div>

                    {/* Current Stage */}
                    <div className="current-stage">
                        <div className="stage-indicator">
                            <Sparkles className="sparkle-icon" size={20} />
                            <span className="stage-text">{currentStage}</span>
                        </div>
                        {currentCV && (
                            <div className="current-cv">
                                <span className="cv-label">Analyzing:</span>
                                <span className="cv-name">{currentCV}</span>
                            </div>
                        )}
                    </div>

                    {/* AI Animation */}
                    <div className="ai-animation">
                        <div className="neural-network">
                            <div className="node node-1"></div>
                            <div className="node node-2"></div>
                            <div className="node node-3"></div>
                            <div className="node node-4"></div>
                            <div className="connection connection-1"></div>
                            <div className="connection connection-2"></div>
                            <div className="connection connection-3"></div>
                        </div>
                    </div>
                </div>
            )}

            {matchResults && !matching && (
                <MatchResults results={matchResults} />
            )}
        </div>
    );
};

export default MatchingInterface;


