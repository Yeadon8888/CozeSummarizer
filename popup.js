// 获取DOM元素
const tokenInput = document.getElementById('token');
const saveButton = document.getElementById('save');
const successMessage = document.getElementById('success-message');

// 页面加载时读取已保存的授权码
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['cozeToken'], function(result) {
    if (result.cozeToken) {
      tokenInput.value = result.cozeToken;
    }
  });
});

// 保存设置
saveButton.addEventListener('click', async function() {
  const token = tokenInput.value.trim();
  
  if (!token) {
    alert('请输入授权码');
    return;
  }
  
  try {
    // 保存到chrome.storage
    await chrome.storage.local.set({ cozeToken: token });
    
    // 显示成功消息
    successMessage.style.display = 'block';
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
    
    // 向所有标签页广播授权码更新消息
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          type: 'tokenUpdated',
          token: token 
        });
      });
    });
    
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('保存设置失败，请重试');
  }
});

