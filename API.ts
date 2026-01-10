import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.API_URL || "http://localhost";
const port = Constants.expoConfig?.extra?.PORT || "5000";
const BASE = `${apiUrl}:${port}`;

async function request(path:any, options:any = {}) {
    const url = `${BASE}${path}`;
    console.log("Full URL API Request:", url);
    const opts = {
        headers: { "Content-Type": "application/json" },
        ...options,
    };
    if (opts.body && typeof opts.body === "object") opts.body = JSON.stringify(opts.body);

    try {
        const res = await fetch(url, opts);
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();

        console.log("Response Status:", res.status);
        if(!res.ok) {
            const err:any = new Error(body?.error || body?.message || res.statusText);
            err.status = res.status;
            err.body = body;
            throw err;
        }

        return body;
    } catch (error:any) {
        console.error("API Error:", error.message);
        console.error("Full error:", error);
        throw error;
    }

};

//API score
export const createProfile = (payload: Object) => request("/api/score", {method:"POST", body: payload});
export const getProfile = (id:String) => request(`/api/score/${id}`, {method:"GET"});
export const setExperience = (id:String, experience:Number) => request(`/score/${id}/experience`, {method:"PATCH", body: {experience}});
export const updateScoreForTheme = (id:String, payload:Object) => request(`/score/${id}`, {method:"PUT", body: payload}); // payload: { theme, highScore, totalQuestions }

//API quizz
export const getRandomQuizByTheme = () => request(`/api/quiz/themes`, {method:"GET"});
export const getThemes = () => request(`/api/quiz/`, {method:"GET"});
export const createQuiz = () => request(`/api/quiz/create`, {method: "GET"});

export default {request};