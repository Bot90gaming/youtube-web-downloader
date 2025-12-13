// Reusable validation, exported if needed
module.exports = {
    validateURL: (url) => {
        // Same regex as above
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|instagram\.com)/i.test(url);
    }
};