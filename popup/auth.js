document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.getElementById('submitAuth').addEventListener('click', () => {
    const authCode = document.getElementById('authCode').value.trim();
    const successMsg = document.getElementById('successMsg');
    const errorMsg = document.getElementById('errorMsg');
    
    // 隐藏所有状态消息
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    
    if (authCode.length > 0) {
        // 保存授权码到 Chrome Storage
        chrome.storage.local.set({ cozeToken: authCode }, async function() {
            // 显示成功消息
            successMsg.style.display = 'block';
            
            // 向所有标签页广播授权码更新消息
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'tokenUpdated',
                        token: authCode
                    });
                });
            });
            
            // 延迟跳转
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    } else {
        errorMsg.style.display = 'block';
    }
});

// 输入框获得焦点时隐藏错误消息
document.getElementById('authCode').addEventListener('focus', () => {
    document.getElementById('errorMsg').style.display = 'none';
}); 