export const JABATAN_VALUES = ['staff', 'manager', 'supervisor'] as const;
export const ROLE_VALUES = ['admin', 'staff'] as const;
export const DEPARTEMEN_VALUES = ['SALES', 'IT', 'FINANCE', 'PURCHASE'] as const;

export const isStrongPassword = (password: string): boolean => {
    // Minimum 12 chars, at least one uppercase, one number, and one symbol.
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
    return strongPasswordRegex.test(password);
};

export const jabatanIndex = (value: string): number => {
    const idx = JABATAN_VALUES.indexOf(value as typeof JABATAN_VALUES[number]);
    if (idx === -1) throw { code: 400, message: 'Invalid jabatan' };
    return idx; // 0=staff, 1=manager, 2=supervisor
};
