document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.getElementById('submitAuth').addEventListener('click', () => {
    const authCode = document.getElementById('authCode').value;
    const successMsg = document.getElementById('successMsg');
    const errorMsg = document.getElementById('errorMsg');
    
    // 隐藏所有状态消息
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    
    // 这里添加实际的授权码验证逻辑
    if (authCode.length > 0) {
        // 模拟验证过程
        successMsg.style.display = 'block';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        errorMsg.style.display = 'block';
    }
});

// 输入框获得焦点时隐藏错误消息
document.getElementById('authCode').addEventListener('focus', () => {
    document.getElementById('errorMsg').style.display = 'none';
}); 