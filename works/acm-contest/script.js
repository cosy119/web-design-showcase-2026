// 页面加载动画
document.addEventListener('DOMContentLoaded', () => {
    // 显示欢迎弹窗
    const welcomeModal = document.getElementById('welcome-modal');
    const modalCloseBtn = document.querySelector('#welcome-modal .close');
    const wechatCloseBtn = document.querySelector('#wechat-qrcode .close');
    
    // 显示弹窗（每次访问都显示）
    welcomeModal.style.display = 'block';

    // 关闭欢迎弹窗
    modalCloseBtn.addEventListener('click', () => {
        welcomeModal.style.display = 'none';
    });

    // 关闭微信二维码弹窗
    wechatCloseBtn.addEventListener('click', () => {
        document.getElementById('wechat-qrcode').style.display = 'none';
    });

    // 点击背景关闭弹窗
    window.addEventListener('click', (e) => {
        if (e.target === welcomeModal) {
            welcomeModal.style.display = 'none';
        }
        if (e.target === document.getElementById('wechat-qrcode')) {
            document.getElementById('wechat-qrcode').style.display = 'none';
        }
    });

    // 欢迎弹窗倒计时
    const welcomeCountdown = document.getElementById('welcome-countdown');
    const welcomeCountdownDate = new Date('2025-05-13T23:59:59').getTime();
    
    const updateWelcomeCountdown = () => {
        const now = new Date().getTime();
        const distance = welcomeCountdownDate - now;
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        welcomeCountdown.innerHTML = `
            ${days}天 ${hours}小时 ${minutes}分 ${seconds}秒
        `;
        
        if (distance < 0) {
            clearInterval(welcomeCountdownInterval);
            welcomeCountdown.innerHTML = "报名已结束";
        }
    };
    
    // 更新倒计时
    const welcomeCountdownInterval = setInterval(updateWelcomeCountdown, 1000);
    updateWelcomeCountdown();

    // 添加滚动动画
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.card, .event, .prize-item');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // 初始化元素样式
    document.querySelectorAll('.card, .event, .prize-item').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.5s ease';
    });

    // 监听滚动事件
    window.addEventListener('scroll', animateOnScroll);
    
    // 初始执行一次
    animateOnScroll();

    // 添加按钮悬停效果
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-3px)';
            button.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
    });

    // 分享功能
    const shareData = {
        title: '2025年山东理工大学第17届ACM程序设计大赛',
        text: '用代码征服思维巅峰！快来参加2025年山东理工大学第17届ACM程序设计大赛！',
        url: window.location.href
    };

    // 微信分享
    const wechatBtn = document.querySelector('.share-btn.wechat');
    const wechatModal = document.getElementById('wechat-qrcode');

    // 生成二维码
    QRCode.toCanvas(document.getElementById('qrcode'), window.location.href, {
        width: 200,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });

    wechatBtn.addEventListener('click', () => {
        wechatModal.style.display = 'block';
    });

    // QQ分享
    document.querySelector('.share-btn.qq').addEventListener('click', () => {
        const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}`;
        window.open(qqUrl, '_blank');
    });

    // 微博分享
    document.querySelector('.share-btn.weibo').addEventListener('click', () => {
        const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.text)}`;
        window.open(weiboUrl, '_blank');
    });

    // 添加打字机效果
    const typingText = document.querySelector('.typing-text');
    const text = typingText.textContent;
    typingText.textContent = '';
    let i = 0;

    const typeWriter = () => {
        if (i < text.length) {
            typingText.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };

    typeWriter();

    // 添加卡片翻转效果
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'perspective(1000px) rotateY(180deg)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateY(0deg)';
        });
    });
}); 