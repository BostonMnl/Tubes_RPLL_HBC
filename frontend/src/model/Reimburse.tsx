export type Reimburse = {
  reimburse_id: string;
  user_id: string;
  keterangan: string;
  nominal: number;
  gambar: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  tanggal: string;
  user:User
};


type User={
    nama:string;
    jabatan:string;
}