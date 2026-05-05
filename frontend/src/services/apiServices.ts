
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
    const response = await fetchWithToken(`${API_BASE_URL}/managerial/users/${userId}`);
    return handleResponse(response);
  },
  getMyProfile: async () => {
    const response = await fetchWithToken(`${API_BASE_URL}/me`);
    return handleResponse(response);
  },
  getUserByIdManagerial: async (userId: string) => {
    const response = await fetchWithToken(`${API_BASE_URL}/managerial/users/${userId}`);
    return handleResponse(response);
  },

  // Create new user
  createUser: async (userData: Partial<User> | FormData) => {
    const isFormData = userData instanceof FormData;

    const response = await fetchWithToken(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      body: isFormData ? userData : JSON.stringify(userData),
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    });

    return handleResponse(response);
  },

  updateMe: async (userData: Partial<User>) => {
    const response = await fetchWithToken(`${API_BASE_URL}/me`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  // Update user
  updateUser: async (
    userId: string,
    userData: Partial<User> | FormData
  ) => {
    const isFormData = userData instanceof FormData;

    console.log(isFormData)
    console.log(userData)

    const body: BodyInit | null = isFormData
      ? userData
      : JSON.stringify(userData);

    const response = await fetchWithToken(
      `${API_BASE_URL}/admin/users/${userId}`,
      {
        method: 'PATCH',
        body,
        headers: isFormData
          ? undefined
          : { 'Content-Type': 'application/json' },
      }
    );

    return handleResponse(response);
  },

  deleteUser: async (userId: string) => {
    const response = await fetchWithToken(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  resetPassword: async (userId: string, body: { newPassword: string }) => {
    return fetchWithToken(`${API_BASE_URL}/admin/users/reset/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(handleResponse);
  },

  promoteUser: async (userId: string, body: { jabatan: string }) => {
    return fetchWithToken(`${API_BASE_URL}/managerial/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(handleResponse);
  },


};

// // ============ ATTENDANCE SERVICES ============
export const attendanceServices = {
  getAllAttendance: async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/attendance/manage`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return await response.json();
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  // Get attendance by user ID
  getAttendanceByUserId: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return await response.json();
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  // Create attendance record
  createAttendance: async (attendanceData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });
      if (!response.ok) throw new Error('Failed to create attendance');
      return await response.json();
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  },
};

// // ============ LEAVE SERVICES ============
export const leaveServices = {
  // Get all leave requests
  getReqAllLeaves: async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuti`,);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch leaves: ${text}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  },

  getAllLeaves: async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuti/all`,);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch leaves: ${text}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  },
  requestLeaveForUser: async (leaveData: {
    user_id: string;
    tanggal_mulai: string;
    tanggal_akhir: string;
    jenis_cuti: string;
    keterangan: string;
  }) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuti/for-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveData),
      });
      if (!response.ok) throw new Error('Failed to request leave for user');
      return await response.json();
    } catch (error) {
      console.error('Error requesting leave for user:', error);
      throw error;
    }
  },

  // Request leave
  requestLeave: async (leaveData: any) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaveData),
      });
      if (!response.ok) throw new Error('Failed to request leave');
      return await response.json();
    } catch (error) {
      console.error('Error requesting leave:', error);
      throw error;
    }
  },

  // Update leave status
  updateLeaveStatus: async (leaveId: string, status: string) => {
    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/cuti/${leaveId}/approval`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to update leave: ${text}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error updating leave:', error);
      throw error;
    }
  },
};

// ============ WAGE SERVICES ============
export const wageServices = {
  // Get all wages
  getMyGaji: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gaji/me`);
      if (!response.ok) throw new Error('Failed to fetch wages');
      return await response.json();
    } catch (error) {
      console.error('Error fetching wages:', error);
      throw error;
    }
  },
  getAllGaji: async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/gaji`);
      if (!response.ok) throw new Error('Failed to fetch wages');
      return await response.json();
    } catch (error) {
      console.error('Error fetching wages:', error);
      throw error;
    }
  },

  // Get wage by user ID
  getGajiByUserId: async (userId: string) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/gaji/${userId}`);
      if (response.status != 200) throw new Error('Failed to fetch wage');
      return await response.json();
    } catch (error) {
      console.error('Error fetching wage:', error);
      throw error;
    }
  },

  // Update wage settings
  updateGaji: async (userId: string, wageData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gaji/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wageData),
      });
      if (!response.ok) throw new Error('Failed to update wage');
      return await response.json();
    } catch (error) {
      console.error('Error updating wage:', error);
      throw error;
    }
  },

  createGaji: async (wageData: {
    user_id: string;
    nominal: Number;
    tanggal_berlaku: string;
  }) => {
    const response = await fetchWithToken(`${API_BASE_URL}/gaji`, {
      method: 'POST',
      body: JSON.stringify(wageData),
    });
    return handleResponse(response);
  },

};

// ============ REIMBURSE SERVICES ============
export const reimburseServices = {
  // Get all reimbursement requests
  getAllReimburse: async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/reimburse`);

      if (!response.ok) throw new Error('Failed to fetch reimbursements');

      return await response.json();
    } catch (error) {
      console.error('Error fetching reimbursements:', error);
      throw error;
    }
  },
  getHistoryAllReimburse: async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/reimburse/history/all`);
      if (!response.ok) throw new Error('Failed to fetch reimbursements');
      return await response.json();
    } catch (error) {
      console.error('Error fetching reimbursements:', error);
      throw error;
    }
  },

  getReimburseByUserId: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reimburses/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch reimbursement');
      return await response.json();
    } catch (error) {
      console.error('Error fetching reimbursement:', error);
      throw error;
    }
  },

  // Request reimbursement
  requestReimburse: async (reimburseData: FormData) => {
    const response = await fetchWithToken(`${API_BASE_URL}/reimburse`, {
      method: 'POST',
      body: reimburseData,
      // jangan set Content-Type — browser otomatis set boundary untuk FormData
    });
    return handleResponse(response);
  },

  requestReimburseForUser: async (formData: FormData) => {
    const response = await fetchWithToken(
      `${API_BASE_URL}/reimburse/for-user`,
      {
        method: 'POST',
        body: formData,
      }
    );

    return handleResponse(response);
  },

  // ===========================
  // APPROVAL
  // ===========================
  updateReimburseStatus: async (
    reimburseId: string,
    status: string
  ) => {
    const response = await fetchWithToken(
      `${API_BASE_URL}/reimburse/${reimburseId}/approval`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    return handleResponse(response);
  },

  getMyReimburse: async () => {
    const response =
      await fetchWithToken(
        `${API_BASE_URL}/reimburse/me`
      );

    return handleResponse(
      response
    );
  },

};

// ============ PINALTI SERVICES ============
export const pinaltiServices = {
  // Gunakan /penalti (bukan pinalti)
  getAllPinalti: async () => {
    try {
      console.log("===================== Get All Pinalti =====================");
      console.log("Fetching all pinalti records...");
      const response = await fetchWithToken(`${API_BASE_URL}/penalti`);
      console.log("Response received:", response);
      if (!response.ok) throw new Error('Failed to fetch pinalti records');
      return await response.json();
    } catch (error) {
      console.error('Error fetching pinalti records:', error);
      throw error;
    }
  },

  // Tambahkan endpoint untuk /me (Untuk Staff/User biasa)
  getMyPinalti: async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/penalti/me`);
      if (!response.ok) throw new Error('Failed to fetch my pinalti');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getPinaltiByUserId: async (userId: string) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/penalti/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user pinalti');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  createPinalti: async (pinaltiData: any) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/penalti`, {
        method: 'POST',
        // Hapus header 'Content-Type': 'application/json' jika kamu mengirim FormData (Upload Gambar)
        body: pinaltiData, 
      });
      if (!response.ok) throw new Error('Failed to create pinalti');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  updatePinalti: async (pinaltiId: string, updateData: any) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/penalti/${pinaltiId}`, {
        method: 'PUT',
        body: updateData,
      });
      if (!response.ok) throw new Error('Failed to update pinalti');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deletePinalti: async (pinaltiId: string) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/penalti/${pinaltiId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete pinalti');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

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


export const qrGeneratorService = {
  recordStart: async (time: string) => {
    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/attendance/record-start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ time }),
        }
      );

      return await handleResponse(response);
    } catch (err) {
      console.error('Error recordStart:', err);
      throw err;
    }
  },

  getQR: async () => {
    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/attendance/qr`
      );

      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching QR:', error);
      throw error;
    }
  },
  getCheckoutQR: async () => {
    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/attendance/checkout/qr`
      );

      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching QR:', error);
      throw error;
    }
  },
};
