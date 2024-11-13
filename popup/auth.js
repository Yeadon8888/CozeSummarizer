document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.getElementById('submitAuth').addEventListener('click', async () => {
    const authCode = document.getElementById('authCode').value.trim();
    const successMsg = document.getElementById('successMsg');
    const errorMsg = document.getElementById('errorMsg');
    
    // 隐藏所有状态消息
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    
    if (!authCode) {
        errorMsg.style.display = 'block';
        return;
    }

    try {
        // 保存授权码到 chrome.storage
        await chrome.storage.local.set({ cozeToken: authCode });
        
        // 向所有标签页广播授权码更新消息
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'tokenUpdated',
                    token: authCode
                });
            } catch (e) {
                console.log('Tab message failed:', e);
            }
        }

        // 显示成功消息
        successMsg.style.display = 'block';
        
        // 1.5秒后返回主页
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('保存授权码失败:', error);
        errorMsg.textContent = '保存失败，请重试';
        errorMsg.style.display = 'block';
    }
});

// 输入框获得焦点时隐藏错误消息
document.getElementById('authCode').addEventListener('focus', () => {
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('successMsg').style.display = 'none';
});

// 页面加载时检查是否已有授权码
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['cozeToken'], function(result) {
        if (result.cozeToken) {
            document.getElementById('authCode').value = result.cozeToken;
        }
    });
}); 