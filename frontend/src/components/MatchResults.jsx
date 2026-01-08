import React, { useState } from 'react';
import { Trophy, TrendingUp, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import './MatchResults.css';

const MatchResults = ({ results }) => {
    const [expandedId, setExpandedId] = useState(null);

    const getScoreColor = (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    };

    const getMatchIcon = (score) => {
        if (score >= 80) return <Trophy size={24} />;
        if (score >= 60) return <TrendingUp size={24} />;
        return <CheckCircle size={24} />;
    };

    return (
        <div className="match-results fade-in">
            <div className="results-header glass-card">
                <div className="results-title">
                    <Trophy size={32} />
                    <div>
                        <h2>Matching Results</h2>
                        <p>
                            Matched <strong>{results.total_cvs_matched}</strong> CVs against{' '}
                            <strong>{results.jd_name}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="results-list">
                {results.results && results.results.length > 0 ? (
                    results.results.map((result, index) => (
                        <div
                            key={result.cv_id}
                            className={`result-card glass-card ${getScoreColor(result.score)}`}
                        >
                            <div className="result-header">
                                <div className="rank-badge">#{index + 1}</div>

                                <div className="result-info">
                                    <h3>{result.cv_name}</h3>
                                    <span className={`match-level badge badge-${getScoreColor(result.score)}`}>
                                        {result.match_level}
                                    </span>
                                </div>

                                <div className="score-display">
                                    <div className={`score-circle ${getScoreColor(result.score)}`}>
                                        <span className="score-value">{result.score}</span>
                                        <span className="score-label">Score</span>
                                    </div>
                                </div>

                                <button
                                    className="expand-btn"
                                    onClick={() => setExpandedId(expandedId === result.cv_id ? null : result.cv_id)}
                                >
                                    {expandedId === result.cv_id ? (
                                        <ChevronUp size={20} />
                                    ) : (
                                        <ChevronDown size={20} />
                                    )}
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="score-bar">
                                <div
                                    className={`score-fill ${getScoreColor(result.score)}`}
                                    style={{ width: `${result.score}%` }}
                                ></div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === result.cv_id && (
                                <div className="result-details">
                                    <div className="detail-section">
                                        <h4>
                                            <CheckCircle size={18} />
                                            Key Matches
                                        </h4>
                                        {result.key_matches && result.key_matches.length > 0 ? (
                                            <ul className="match-list">
                                                {result.key_matches.map((match, i) => (
                                                    <li key={i}>
                                                        <CheckCircle size={14} />
                                                        {match}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="no-data">No specific matches identified</p>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <h4>
                                            <XCircle size={18} />
                                            Gaps
                                        </h4>
                                        {result.gaps && result.gaps.length > 0 ? (
                                            <ul className="gap-list">
                                                {result.gaps.map((gap, i) => (
                                                    <li key={i}>
                                                        <XCircle size={14} />
                                                        {gap}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="no-data">No significant gaps identified</p>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <h4>Summary</h4>
                                        <p className="summary-text">{result.summary}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-results glass-card">
                        <p>No matching results available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchResults;
