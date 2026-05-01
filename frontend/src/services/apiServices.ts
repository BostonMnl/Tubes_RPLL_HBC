
import { fetchWithToken } from '../utils/fetchInterceptor';
import type { User } from '../model/User';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Helper terpusat untuk menangani respons dari fetch.
 * @param response - Objek Response dari fetch.
 * @returns Promise yang resolve dengan data JSON jika berhasil.
 * @throws Error dengan pesan yang relevan jika gagal.
 */
async function handleResponse(response: Response) {
    if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
            // Coba parse sebagai JSON untuk mendapatkan pesan error spesifik dari API.
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Jika gagal parse, berarti respons bukan JSON (kemungkinan halaman error HTML).
            console.error("Server returned non-JSON error response:", responseText);
        }
        throw new Error(errorMessage);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export const userServices = {
    // Get all users
    getAllUsers: async () => {
        const response = await fetchWithToken(`${API_BASE_URL}/admin/users`);
        return handleResponse(response);
    },

    // Get user by ID
    getUserById: async (userId: string) => {
        const response = await fetchWithToken(`${API_BASE_URL}/admin/users/${userId}`);
        return handleResponse(response);
    },

    // Create new user
    createUser: async (userData: Partial<User>) => {
        const response = await fetchWithToken(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    // Update user
    updateUser: async (userId: string, userData: Partial<User> | FormData) => {
        const response = await fetchWithToken(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    // Delete user
    deleteUser: async (userId: string) => {
        const response = await fetchWithToken(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },
};

// // ============ ATTENDANCE SERVICES ============
// export const attendanceServices = {
//   // Get all attendance records
//   getAllAttendance: async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/attendance`);
//       if (!response.ok) throw new Error('Failed to fetch attendance');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching attendance:', error);
//       throw error;
//     }
//   },

//   // Get attendance by user ID
//   getAttendanceByUserId: async (userId: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/attendance/user/${userId}`);
//       if (!response.ok) throw new Error('Failed to fetch attendance');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching attendance:', error);
//       throw error;
//     }
//   },

//   // Create attendance record
//   createAttendance: async (attendanceData: any) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/attendance`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(attendanceData),
//       });
//       if (!response.ok) throw new Error('Failed to create attendance');
//       return await response.json();
//     } catch (error) {
//       console.error('Error creating attendance:', error);
//       throw error;
//     }
//   },
// };

// // ============ LEAVE SERVICES ============
// export const leaveServices = {
//   // Get all leave requests
//   getAllLeaves: async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/leaves`);
//       if (!response.ok) throw new Error('Failed to fetch leaves');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching leaves:', error);
//       throw error;
//     }
//   },

//   // Get leave by user ID
//   getLeaveByUserId: async (userId: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/leaves/user/${userId}`);
//       if (!response.ok) throw new Error('Failed to fetch leaves');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching leaves:', error);
//       throw error;
//     }
//   },

//   // Request leave
//   requestLeave: async (leaveData: any) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/leaves`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(leaveData),
//       });
//       if (!response.ok) throw new Error('Failed to request leave');
//       return await response.json();
//     } catch (error) {
//       console.error('Error requesting leave:', error);
//       throw error;
//     }
//   },

//   // Update leave status
//   updateLeaveStatus: async (leaveId: string, status: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/leaves/${leaveId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ status }),
//       });
//       if (!response.ok) throw new Error('Failed to update leave');
//       return await response.json();
//     } catch (error) {
//       console.error('Error updating leave:', error);
//       throw error;
//     }
//   },
// };

// // ============ WAGE SERVICES ============
// export const wageServices = {
//   // Get all wages
//   getAllWages: async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/wages`);
//       if (!response.ok) throw new Error('Failed to fetch wages');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching wages:', error);
//       throw error;
//     }
//   },

//   // Get wage by user ID
//   getWageByUserId: async (userId: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/wages/user/${userId}`);
//       if (!response.ok) throw new Error('Failed to fetch wage');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching wage:', error);
//       throw error;
//     }
//   },

//   // Update wage settings
//   updateWageSettings: async (userId: string, wageData: any) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/wages/${userId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(wageData),
//       });
//       if (!response.ok) throw new Error('Failed to update wage');
//       return await response.json();
//     } catch (error) {
//       console.error('Error updating wage:', error);
//       throw error;
//     }
//   },
// };

// // ============ REIMBURSE SERVICES ============
// export const reimburseServices = {
//   // Get all reimbursement requests
//   getAllReimburses: async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/reimburses`);
//       if (!response.ok) throw new Error('Failed to fetch reimbursements');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching reimbursements:', error);
//       throw error;
//     }
//   },

//   // Get reimbursement by user ID
//   getReimburseByUserId: async (userId: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/reimburses/user/${userId}`);
//       if (!response.ok) throw new Error('Failed to fetch reimbursement');
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching reimbursement:', error);
//       throw error;
//     }
//   },

//   // Request reimbursement
//   requestReimburse: async (reimburseData: any) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/reimburses`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(reimburseData),
//       });
//       if (!response.ok) throw new Error('Failed to request reimbursement');
//       return await response.json();
//     } catch (error) {
//       console.error('Error requesting reimbursement:', error);
//       throw error;
//     }
//   },

//   // Update reimbursement status
//   updateReimburseStatus: async (reimburseId: string, status: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/reimburses/${reimburseId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ status }),
//       });
//       if (!response.ok) throw new Error('Failed to update reimbursement');
//       return await response.json();
//     } catch (error) {
//       console.error('Error updating reimbursement:', error);
//       throw error;
//     }
//   },
// };

// ============ AUTHENTICATION SERVICES WITH JWT ============
export const authServices = {
    login: async (email: string, password: string) => {
        const response = await fetchWithToken(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        const data = await handleResponse(response);
        return {
            token: data.data.token,
            user: data.data.user,
        };
    },

    refreshToken: async () => {
        try {
            const response = await fetchWithToken(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
            });

            const data = await handleResponse(response);

            // Update token di localStorage
            localStorage.setItem('token', data.token);
            if (data.expiresIn) {
                localStorage.setItem('tokenExpiry', data.expiresIn);
            }

            return data;
        } catch (error) {
            console.error('Error refreshing token:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiry');
            throw error;
        }
    },

    // Logout
    logout: async () => {
        // Panggil endpoint logout di server. Gagal atau berhasil, token di client akan dihapus.
        // Interceptor akan menambahkan token yang ada.
        await fetchWithToken(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
        }).catch(err => {
            // Log error tapi jangan hentikan proses logout di client
            console.error('Server logout failed, continuing client logout:', err);
        });
    },

    // Verify token - check apakah token masih valid
    verifyToken: async () => {
        const response = await fetchWithToken(`${API_BASE_URL}/auth/verify`, {
            method: 'GET',
        });
        return handleResponse(response);
    },
};

// ============ HELPER FUNCTION - Get Authorization Header ============
export const getAuthHeader = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};
