document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// 选择订阅方案
const priceCards = document.querySelectorAll('.price-card');
priceCards.forEach(card => {
    card.addEventListener('click', () => {
        // 移除其他卡片的选中状态
        priceCards.forEach(c => c.classList.remove('selected'));
        // 添加当前卡片的选中状态
        card.classList.add('selected');
    });
});

// 订阅按钮点击事件
document.getElementById('subscribeBtn').addEventListener('click', () => {
    const selectedPlan = document.querySelector('.price-card.selected').dataset.plan;
    // 这里添加订阅逻辑
    console.log('选择的订阅方案:', selectedPlan);
}); 