import cron from 'node-cron';
import { User } from 'models/user';
import { processUserPayroll } from '../controllers/payroll.controller';
import { Op } from 'sequelize';

/**
 * Menginisialisasi tugas terjadwal (Cron Job) untuk pemrosesan payroll bulanan.
 * Tugas ini dijalankan secara otomatis berdasarkan jadwal yang ditentukan.
 */
const schedulePayrollJob = () => {
    /**
     * Jadwal: Tanggal 26 setiap bulan, pukul 00:00.
     * Alasan: Menjalankan proses setelah periode cutoff tanggal 25 berakhir.
     */
    // cron.schedule('0 0 26 * *', async () => {
    cron.schedule('*/1 * * * *', async () => {
        console.log('====================================================');
        console.log('[CRON JOB] Memulai eksekusi payroll otomatis...');
        console.log(`[WAKTU] ${new Date().toLocaleString()}`);
        console.log('====================================================');

        try {
            const now = new Date();
            const bulan = now.getMonth() + 1;
            const tahun = now.getFullYear();

            /**
             * Mengambil daftar user aktif yang berhak mendapatkan payroll.
             * Role 'admin' dikecualikan dari proses otomatis ini.
             */
            const users = await User.findAll({
                where: {
                    role: { [Op.ne]: 'admin' }
                }
            });

            console.log(`[INFO] Menemukan ${users.length} user untuk diproses.`);

            let successCount = 0;
            let skipCount = 0;
            let failCount = 0;

            for (const user of users) {
                try {
                    /**
                     * Menjalankan mesin perhitungan payroll untuk tiap user.
                     * Fungsi ini mengembalikan object Payroll jika baru dibuat, 
                     * atau null jika payroll periode tersebut sudah ada.
                     */
                    const payrollResult = await processUserPayroll(
                        user.user_id, 
                        bulan, 
                        tahun
                    );

                    if (payrollResult) {
                        console.log(`[SUCCESS] Payroll berhasil dibuat untuk: ${user.nama} (ID: ${user.user_id})`);
                        successCount++;
                    } else {
                        console.log(`[SKIP] User ${user.nama} sudah diproses sebelumnya untuk periode ini.`);
                        skipCount++;
                    }
                } catch (userError: any) {
                    failCount++;
                    console.error(`[ERROR] Gagal memproses payroll user ${user.nama} (ID: ${user.user_id}):`);
                    console.error(`Detail: ${userError.message || userError}`);
                }
            }

            // Ringkasan hasil eksekusi cron job
            console.log('----------------------------------------------------');
            console.log('[RINGKASAN EKSEKUSI PAYROLL]');
            console.log(`Total User    : ${users.length}`);
            console.log(`Berhasil      : ${successCount}`);
            console.log(`Dilewati      : ${skipCount}`);
            console.log(`Gagal         : ${failCount}`);
            console.log('----------------------------------------------------');
            console.log(`[CRON JOB] Selesai pada: ${new Date().toLocaleString()}`);
            console.log('====================================================');

        } catch (globalError: any) {
            console.error('====================================================');
            console.error('[CRITICAL ERROR] Terjadi kesalahan fatal pada sistem Cron Job:');
            console.error(globalError.message || globalError);
            console.error('====================================================');
        }
    });

    console.log('[SYSTEM] Cron Job Payroll berhasil dijadwalkan (Tanggal 26 jam 00:00).');
};

export default schedulePayrollJob;