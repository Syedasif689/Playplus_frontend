import API from './api';
import defaultVideos from '../data/videos';

export const seedVideos = async () => {
    try {
        // Check if videos already exist
        const response = await API.get('/videos');
        if (response.data && response.data.length > 0) {
            console.log('Videos already exist in database');
            return { success: true, message: 'Videos already exist' };
        }

        // Prepare videos for database
        const videosToSeed = defaultVideos.map(video => ({
            title: video.title,
            description: video.description || '',
            videoUrl: video.videoUrl || 'https://www.youtube.com/watch?v=test',
            thumbnail: video.thumbnail || 'https://picsum.photos/300/180',
            creator: video.creator || 'Unknown',
            creatorId: 1, // Default to user ID 1
            views: 0,
            likes: 0,
            dislikes: 0,
            shareCount: 0
        }));

        const seedResponse = await API.post('/videos/seed', videosToSeed);
        console.log('Videos seeded successfully:', seedResponse.data);
        return { success: true, data: seedResponse.data };
    } catch (error) {
        console.error('Error seeding videos:', error);
        return { success: false, error: error.message };
    }
};