// API配置
let API_CONFIG = {
  url: 'https://api.coze.cn/v1/workflow/run',
  token: '',
  workflowId: '7397447363159130127'
};

// 初始化时获取存储的token
chrome.storage.local.get(['cozeToken'], function(result) {
  console.log('初始化获取token:', result);
  if (result.cozeToken) {
    API_CONFIG.token = result.cozeToken;
  }
});

// 监听来自popup的token更新消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('收到消息:', message);
  if (message.type === 'tokenUpdated') {
    console.log('更新token:', message.token);
    API_CONFIG.token = message.token;
  }
});

// 创建悬浮球
function createFloatBall() {
    // 创建悬浮球容器
    const floatBall = document.createElement('div');
    floatBall.className = 'float-ball';

    // 创建球体容器
    const ballContainer = document.createElement('div');
    ballContainer.className = 'ball-container';

    // 创建图标容器
    const ballIcon = document.createElement('div');
    ballIcon.className = 'ball-icon';
    
    // 创建图标图片
    const iconImg = document.createElement('img');
    iconImg.src = chrome.runtime.getURL('icon.png');
    iconImg.style.width = '20px';
    iconImg.style.height = '20px';
    ballIcon.appendChild(iconImg);

    // 创建文字
    const ballText = document.createElement('div');
    ballText.className = 'ball-text';
    ballText.textContent = '内容总结';

    // 创建对勾标记
    const checkMark = document.createElement('div');
    checkMark.className = 'check-mark';
    const checkIcon = document.createElement('i');
    checkIcon.className = 'fas fa-check';
    checkMark.appendChild(checkIcon);
    ballIcon.appendChild(checkMark);

    // 组装悬浮球
    ballContainer.appendChild(ballIcon);
    ballContainer.appendChild(ballText);
    floatBall.appendChild(ballContainer);

    // 添加点击事件
    ballContainer.addEventListener('click', async () => {
        // 检查是否已设置token
        if (!API_CONFIG.token) {
            alert('请先在插件设置中配置授权码');
            return;
        }
        
        try {
            const result = await callCozeAPI(window.location.href);
            if (result && result.data) {
                const innerData = JSON.parse(result.data);
                if (innerData.data) {
                    // 创建或更新总结面板
                    showSummaryPanel(innerData.data);
                } else {
                    throw new Error('API返回数据格式错误');
                }
            } else {
                throw new Error('API响应无效');
            }
        } catch (error) {
            console.error('API调用错误:', error);
            alert('处理失败: ' + error.message);
        }
    });

    // 添加到页面
    document.body.appendChild(floatBall);

    // 添加字体图标
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
}

// 显示总结面板
function showSummaryPanel(content) {
    let panel = document.querySelector('.summary-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'summary-panel';
        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div class="summary-header">
            <h3>内容总结</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="summary-content">${content}</div>
    `;

    // 添加关闭按钮事件
    panel.querySelector('.close-btn').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    // 显示面板
    panel.style.display = 'block';
}

// 调用API
async function callCozeAPI(url) {
    console.log('当前token:', API_CONFIG.token);
    
    if (!API_CONFIG.token) {
        throw new Error('请先设置授权码');
    }
    
    const encodedToken = encodeURIComponent(API_CONFIG.token);
    console.log('编码后的token:', encodedToken);
    
    try {
        console.log('准备发送API请求...');
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${encodedToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                workflow_id: API_CONFIG.workflowId,
                parameters: {
                    article_url: url
                }
            })
        });

        console.log('API响应状态:', response.status);

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const result = await response.json();
        console.log('API返回数据:', result);
        return result;
    } catch (error) {
        console.error('API调用详细错误:', error);
        throw error;
    }
}

// 确保页面完全加载后再创建悬浮球
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatBall);
} else {
    createFloatBall();
} 