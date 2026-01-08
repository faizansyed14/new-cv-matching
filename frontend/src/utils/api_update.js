export const matchCVsToJD = async (jdId, cvIds = null, model = 'openai') => {
    const response = await api.post('/match', {
        jd_id: jdId,
        cv_ids: cvIds,
        model: model,
    });
    return response.data;
};
