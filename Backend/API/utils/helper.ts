export const isStrongPassword = (password: string): boolean => {
    // Minimum 12 chars, at least one uppercase, one number, and one symbol.
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
    return strongPasswordRegex.test(password);
};
