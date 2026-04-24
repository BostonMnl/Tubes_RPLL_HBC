export type Reimburse = {
  reimburse_id: string;
  user_id: string;
  keterangan: string;
  nominal: number;
  gambar: string;
  status: 'pending' | 'approved' | 'rejected';
  tanggal: string;
};