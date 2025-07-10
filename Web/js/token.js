function getCurrentToken() {
    const currentUserNum = localStorage.getItem('ActiveUser');
    if (!currentUserNum) return null;

    return localStorage.getItem(`Token_${currentUserNum}`);
}
