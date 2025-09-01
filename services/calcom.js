const axios = require('axios');
const logger = require('../utils/logger');

class CalComService {
    constructor() {
        this.baseURL = 'https://api.cal.com/v1';
    }

    /**
     * Dynamically select API key based on equipment type
     */
    getApiKey(equipmentType) {
        const apiKeyMap = {
            PROJECTOR: process.env.CAL_API_KEY_PROJECTOR,
            SPEAKER: process.env.CAL_API_KEY_SPEAKER,
            LOGITECH1: process.env.CAL_API_KEY_LOGITECH1,
            LOGITECH2: process.env.CAL_API_KEY_LOGITECH2
        };

        const selectedKey = apiKeyMap[equipmentType];
        if (!selectedKey) throw new Error(`No API key found for equipment type: ${equipmentType}`);
        return selectedKey;
    }

    /**
     * Create a fresh axios client with the correct API key
     */
    createClient(apiKey) {
        const client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        client.interceptors.request.use(
            (config) => {
                logger.info('Cal.com API Request:', {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    data: config.data
                });
                return config;
            },
            (error) => {
                logger.error('Cal.com API Request Error:', error);
                return Promise.reject(error);
            }
        );

        client.interceptors.response.use(
            (response) => {
                logger.info('Cal.com API Response:', {
                    status: response.status,
                    data: response.data
                });
                return response;
            },
            (error) => {
                logger.error('Cal.com API Response Error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );

        return client;
    }

    /**
     * Reschedule a booking using Cal.com API
     */
    async rescheduleBooking({ bookingUid, startTime, endTime, rescheduledBy, reschedulingReason, equipmentType }) {
        try {
            const apiKey = this.getApiKey(equipmentType);
            const client = this.createClient(apiKey);

            const payload = { bookingUid, startTime, endTime, rescheduledBy, reschedulingReason };

            logger.info('Attempting to reschedule booking:', {
                bookingUid,
                startTime,
                endTime,
                equipmentType
            });

            const response = await client.post('/bookings/reschedule', payload);

            logger.info('Booking rescheduled successfully:', {
                bookingUid,
                responseStatus: response.status
            });

            return {
                success: true,
                data: response.data,
                status: response.status
            };

        } catch (error) {
            logger.error('Failed to reschedule booking:', {
                bookingUid,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            return this.handleApiError(error, 'reschedule');
        }
    }

    /**
     * Cancel a booking using Cal.com API
     */
    async cancelBooking({ bookingUid, cancellationReason, equipmentType }) {
        try {
            const apiKey = this.getApiKey(equipmentType);
            const client = this.createClient(apiKey);

            const payload = { bookingUid, cancellationReason };

            logger.info('Attempting to cancel booking:', { bookingUid, equipmentType });

            const response = await client.post('/bookings/cancel', payload);

            logger.info('Booking cancelled successfully:', {
                bookingUid,
                responseStatus: response.status
            });

            return {
                success: true,
                data: response.data,
                status: response.status
            };

        } catch (error) {
            logger.error('Failed to cancel booking:', {
                bookingUid,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            return this.handleApiError(error, 'cancel');
        }
    }

    /**
     * Get booking details (for debugging/verification)
     */
    async getBooking(bookingUid, equipmentType) {
        try {
            const apiKey = this.getApiKey(equipmentType);
            const client = this.createClient(apiKey);

            logger.info('Fetching booking details:', { bookingUid, equipmentType });

            const response = await client.get(`/bookings/${bookingUid}`);

            return {
                success: true,
                data: response.data,
                status: response.status
            };

        } catch (error) {
            logger.error('Failed to fetch booking:', {
                bookingUid,
                error: error.message
            });

            return this.handleApiError(error, 'fetch');
        }
    }

    /**
     * Handle API errors and format them consistently
     */
    handleApiError(error, operation) {
        const errorResponse = {
            success: false,
            operation,
            timestamp: new Date().toISOString()
        };

        if (error.response) {
            errorResponse.status = error.response.status;
            errorResponse.error = {
                message: error.response.data?.message || `Failed to ${operation} booking`,
                details: error.response.data || 'No additional details available'
            };

            switch (error.response.status) {
                case 400:
                    errorResponse.error.message = 'Invalid request data provided to Cal.com API';
                    break;
                case 401:
                    errorResponse.error.message = 'Unauthorized: Invalid or expired API key';
                    break;
                case 403:
                    errorResponse.error.message = 'Forbidden: Insufficient permissions for this operation';
                    break;
                case 404:
                    errorResponse.error.message = 'Booking not found or already processed';
                    break;
                case 429:
                    errorResponse.error.message = 'Rate limit exceeded. Please try again later';
                    break;
                case 500:
                    errorResponse.error.message = 'Cal.com API server error. Please try again later';
                    break;
                default:
                    errorResponse.error.message = `Cal.com API error: ${error.response.status}`;
            }
        } else if (error.request) {
            errorResponse.status = 503;
            errorResponse.error = {
                message: 'Unable to connect to Cal.com API. Please check your internet connection and try again',
                details: 'Network timeout or connection refused'
            };
        } else {
            errorResponse.status = 500;
            errorResponse.error = {
                message: 'Unexpected error occurred while processing the request',
                details: error.message
            };
        }

        return errorResponse;
    }
}

module.exports = new CalComService();
