// API配置
let API_CONFIG = {
  url: 'https://api.coze.cn/v1/workflow/run',
  token: '',
  workflowId: '7397447363159130127'
};

// 初始化时获取存储的token
chrome.storage.local.get(['cozeToken'], function(result) {
  if (result.cozeToken) {
    API_CONFIG.token = result.cozeToken;
  }
});

// 监听来自popup的token更新消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'tokenUpdated') {
    API_CONFIG.token = message.token;
  }
});

// 调用API前检查token
async function callCozeAPI(url) {
  if (!API_CONFIG.token) {
    throw new Error('请先设置授权码');
  }
  
  // 对 token 进行 UTF-8 编码处理
  const encodedToken = encodeURIComponent(API_CONFIG.token);
  
  try {
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

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API调用错误:', error);
    throw error;
  }
}

// 存储当前页面的总结结果
let currentPageSummary = null;
let currentPageUrl = null;

// 创建悬浮球和面板
function createElements() {
  // 创建悬浮球
  const floatBall = document.createElement('div');
  floatBall.className = 'coze-float-ball';
  
  // 添加图标
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icon.png');
  floatBall.appendChild(icon);
  
  // 创建总结面板
  const summaryPanel = document.createElement('div');
  summaryPanel.className = 'coze-summary-panel';
  summaryPanel.innerHTML = `
    <div class="coze-close-btn">✕</div>
    <div class="coze-back-btn">←</div>
    <div class="coze-content"></div>
    <div class="coze-author-link">
      <span class="like-icon">👍</span>
      来瞧瞧作者吧
    </div>
    <div class="coze-author-page">
      <div class="author-avatar">
        <img src="${chrome.runtime.getURL('avatar.png')}" alt="Yeadon">
      </div>
      <div class="author-name">Yeadon</div>
      <div class="author-title">VX: vip2022shopee</div>
      <div class="author-blog">
        <a href="https://blog.yeadon.top" target="_blank">个人博客</a>
      </div>
      <div class="author-qrcode">
        <img src="${chrome.runtime.getURL('qrcode.png')}" alt="QR Code">
      </div>
      <div class="author-tip">创作不易<br>请作者吃个旺旺碎冰冰</div>
    </div>
  `;
  
  document.body.appendChild(floatBall);
  document.body.appendChild(summaryPanel);
  
  return { floatBall, summaryPanel };
}

// 实现拖动功能
function enableDrag(element) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  
  element.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  function dragStart(e) {
    initialX = e.clientX - element.offsetLeft;
    initialY = e.clientY - element.offsetTop;
    isDragging = true;
  }
  
  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    // 限制拖动范围
    currentX = Math.max(0, Math.min(currentX, window.innerWidth - element.offsetWidth));
    currentY = Math.max(0, Math.min(currentY, window.innerHeight - element.offsetHeight));
    
    element.style.left = `${currentX}px`;
    element.style.top = `${currentY}px`;
    element.style.right = 'auto';
  }
  
  function dragEnd() {
    isDragging = false;
  }

  // 返回isDragging状态检查函数
  return () => isDragging;
}

// 添加重试机制
async function callCozeAPIWithRetry(url, maxRetries = 3) {
  for(let i = 0; i < maxRetries; i++) {
    try {
      return await callCozeAPI(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// 格式化显示结果
function formatContent(content) {
  const formattedHtml = content
    .split('\n')
    .map(line => {
      if (line.includes('![')) {
        const imgUrl = line.match(/\((.*?)\)/)[1];
        const secureUrl = imgUrl.replace(/^http:/, 'https:');
        return `<img src="${secureUrl}" style="max-width:100%; border-radius:4px; margin:10px 0;">`;
      }
      return `<div style="margin: 5px 0;">${line}</div>`;
    })
    .join('');

  return `
    <div style="border: 1px solid #e0e0e0; 
                border-radius: 8px; 
                padding: 15px; 
                margin-top: 10px; 
                background-color: #ffffff;">
      ${formattedHtml}
    </div>
  `;
}

// 下载功能
function downloadSummaryCard(content) {
  // 创建临时元素来提取纯文本
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // 提取文本内容
  const textContent = tempDiv.innerText;
  
  // 创建Blob
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  
  // 创建下载链接
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  
  // 设置文件名（使用当前时间戳）
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `summary-${timestamp}.txt`;
  
  // 触发下载
  document.body.appendChild(a);
  a.click();
  
  // 清理
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// 添加防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 优化API调用
const debouncedCallAPI = debounce(async (url) => {
  try {
    const result = await callCozeAPI(url);
    // 处理结果...
  } catch (error) {
    console.error('API调用错误:', error);
  }
}, 300);

// 使用IntersectionObserver优化滚动性能
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target);
    }
  });
});

function lazyLoadImages() {
  document.querySelectorAll('img[data-src]').forEach(img => {
    observer.observe(img);
  });
}

// 初始化
function init() {
  const { floatBall, summaryPanel } = createElements();
  const contentDiv = summaryPanel.querySelector('.coze-content');
  const closeBtn = summaryPanel.querySelector('.coze-close-btn');
  const backBtn = summaryPanel.querySelector('.coze-back-btn');
  const authorLink = summaryPanel.querySelector('.coze-author-link');
  const authorPage = summaryPanel.querySelector('.coze-author-page');
  
  // 获取isDragging状态检查函数
  const checkIsDragging = enableDrag(floatBall);
  
  // 点击悬浮球获取总结
  floatBall.addEventListener('click', async (e) => {
    // 检查是否正在拖动
    if (checkIsDragging()) return;
    
    e.stopPropagation();
    
    // 检查是否已设置token
    if (!API_CONFIG.token) {
      contentDiv.innerHTML = `
        <div style="color: #f57c00; padding: 10px; background: #fff3e0; border-radius: 4px;">
          请先在插件设置中配置授权码
        </div>
      `;
      summaryPanel.classList.add('active');
      return;
    }
    
    // 如果当前页面已经有总结，直接显示
    if (currentPageUrl === window.location.href && currentPageSummary) {
      summaryPanel.classList.add('active');
      contentDiv.innerHTML = currentPageSummary;
      return;
    }
    
    // 如果是新的总结请求
    summaryPanel.classList.add('active');
    contentDiv.innerHTML = '<div class="coze-loading">正在分析中...</div>';
    
    try {
      const result = await callCozeAPIWithRetry(window.location.href);
      if (result.data) {
        const innerData = JSON.parse(result.data);
        if (innerData.data) {
          const formattedContent = formatContent(innerData.data);
          contentDiv.innerHTML = formattedContent;
          
          // 存储当前页面的总结
          currentPageSummary = formattedContent;
          currentPageUrl = window.location.href;
        } else {
          throw new Error('API返回数据格式错误');
        }
      } else {
        throw new Error('API响应无效');
      }
    } catch (error) {
      contentDiv.innerHTML = `
        <div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;">
          错误: ${error.message}
        </div>
      `;
    }
  });
  
  // 关闭面板
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    summaryPanel.classList.remove('active');
  });
  
  // 点击面板外关闭
  document.addEventListener('click', (e) => {
    if (!summaryPanel.contains(e.target) && !floatBall.contains(e.target)) {
      summaryPanel.classList.remove('active');
    }
  });
  
  // 监听 URL 变化
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      // 重置状态
      currentPageSummary = null;
      currentPageUrl = null;
    }
  }).observe(document, {subtree: true, childList: true});
  
  // 添加作者链接点击事件
  authorLink.addEventListener('click', (e) => {
    e.stopPropagation();
    contentDiv.style.display = 'none';
    authorLink.style.display = 'none';
    authorPage.classList.add('active');
    backBtn.style.display = 'block';
  });
  
  // 添加返回按钮事件
  backBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    contentDiv.style.display = 'block';
    authorLink.style.display = 'flex';
    authorPage.classList.remove('active');
    backBtn.style.display = 'none';
  });
}

// 启动
init(); 