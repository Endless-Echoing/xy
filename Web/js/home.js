var tabs = document.getElementsByClassName("tab");
var tabcontents = document.getElementsByClassName("tabcontent");

if (tabs.length > 0) {
    tabs[0].classList.add("active");
}
tabcontents[0].style.display = "block";

function openTab(evt, tabName, url, title) {
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }
    for (i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");

    location.hash = url;
    document.title = title;
}

function handleHashChange() {
    const hashPath = location.hash.slice(1);

    // 映射 hash
    const tabMap = {
        '/home': { tabName: '首页', title: '首页' },
        '/mycourse': { tabName: '我的课程', title: '我的课程' },
        '/center': { tabName: '发现', title: '发现' }
    };

    const target = tabMap[hashPath];
    if (target) {
        const tabBtn = [...document.getElementsByClassName('tab')].find(el => el.textContent.trim() === target.tabName);
        if (tabBtn) {
            openTab({ currentTarget: tabBtn }, target.tabName, hashPath, target.title);
        }
    }
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange); // 页面首次加载时也执行一次



document.addEventListener('DOMContentLoaded', async function () {
    try {
        const token = sessionStorage.getItem('Token');
        const res = await fetch(API.COURSE_NUMBER, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await res.json();
        if (result.code === 1) {
            const statNumbers = document.querySelectorAll('.stat-number');
            if (statNumbers.length > 0) {
                statNumbers[0].textContent = result.data;
            }
        }
    } catch (e) {
        console.error('获取课程数量失败', e);
    }
});


document.addEventListener('DOMContentLoaded', async function () {
    const nameEl = document.querySelector('.info .name');
    const collegeEl = document.querySelector('.info .college');
    const majorEl = document.querySelector('.major');

    // 如果不是首页（页面中没这些元素），直接退出
    if (!nameEl || !collegeEl || !majorEl) return;

    try {
        const token = sessionStorage.getItem('Token');
        const res = await fetch(API.COURSE_TITLE, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const result = await res.json();
        if (result.code === 1 && result.data) {
            nameEl.textContent = result.data.name || '';
            collegeEl.textContent = result.data.college || '';
            majorEl.textContent = result.data.major || '';

            localStorage.setItem('id', result.data.id);
            localStorage.setItem('studentInfo', JSON.stringify(result.data));
            console.log('已写入 studentInfo 到 localStorage:', result.data);
        } else {
            console.warn('获取学生信息失败：', result);
        }
    } catch (e) {
        console.error('获取学生信息失败:', e);
    }
});



document.addEventListener('DOMContentLoaded', function () {
    const token = sessionStorage.getItem('Token');
    if (!token) return;

    const container = document.querySelector('.feature-section-1 .container .row');
    const paginationWrapper = document.createElement('div');
    paginationWrapper.className = 'd-flex justify-content-end mt-3';
    container.parentElement.appendChild(paginationWrapper);

    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;
    let totalItems = 0;
    let currentKeyword = '';

    // 添加搜索框和按钮
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'd-flex justify-content-end mb-3';

    searchWrapper.innerHTML = `
        <input type="text" class="form-control form-control-sm w-25 me-2" placeholder="搜索课程" id="searchInput">
        <button class="btn btn-primary btn-sm" id="searchBtn">查询</button>
    `;
    container.parentElement.insertBefore(searchWrapper, container);

    document.getElementById('searchBtn').addEventListener('click', async function () {
        currentKeyword = document.getElementById('searchInput').value.trim();
        currentPage = 1; // 搜索时重置页码
        await fetchAndRender();
    });
    document.getElementById('searchInput').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    function renderPagination() {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        paginationWrapper.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline-primary btn-sm me-2';
        prevBtn.textContent = '上一页';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAndRender();
            }
        };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline-primary btn-sm ms-2';
        nextBtn.textContent = '下一页';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchAndRender();
            }
        };

        const info = document.createElement('span');
        info.className = 'align-self-center';
        info.textContent = `第 ${currentPage} / ${totalPages || 1} 页`;

        paginationWrapper.appendChild(prevBtn);
        paginationWrapper.appendChild(info);
        paginationWrapper.appendChild(nextBtn);
    }

    async function fetchAndRender() {
        container.innerHTML = ''; // 清空原有卡片
        console.log('请求地址:', API.COURSE_LIST);
        try {
            const res = await fetch(API.COURSE_LIST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    pageNo: currentPage,
                    pageSize: ITEMS_PER_PAGE,
                    name: currentKeyword || undefined,
                    ifPerson:true
                })
            });

            const result = await res.json();

            if (result.code === 1 && result.data) {
                const { total, records } = result.data;
                totalItems = total;

                if (records.length === 0) {
                    container.innerHTML = `<p class="text-muted font-bond">未找到相关课程</p>`;
                } else {
                    renderCourses(records);
                }

                renderPagination();
            } else {
                container.innerHTML = `<p class="text-danger">加载课程失败</p>`;
            }
        } catch (err) {
            console.error('获取课程失败:', err);
            container.innerHTML = `<p class="text-danger">获取课程失败</p>`;
        }
    }

    function PersistentRandomImage(courseId) {
        const storageKey = 'courseImageMap';
        const imgCount = 8;
        const key = String(courseId);

        let imageMap = {};
        const storedMap = localStorage.getItem(storageKey);
        if (storedMap) {
            try {
                imageMap = JSON.parse(storedMap);
            } catch (e) {
                imageMap = {};
            }
        }

        if (imageMap[key]) {
            return `/大雅之堂/Web/assets/course${imageMap[key]}.png`;
        }

        const randomIndex = Math.floor(Math.random() * imgCount) + 1;
        imageMap[key] = randomIndex;
        localStorage.setItem(storageKey, JSON.stringify(imageMap));

        return `/大雅之堂/Web/assets/course${randomIndex}.png`;
    }



    function renderCourses(records) {
        records.forEach(course => {
            const imgCount = 8;
            const imgSrc=PersistentRandomImage(course.id);

            const card = document.createElement('div');
            card.className = 'col-md-3 mb-4';

            card.innerHTML = `
                <div class="feature-card h-100 shadow-sm position-relative" style="aspect-ratio: 1/1; cursor:pointer;"
                 data-id="${course.id}" data-img="${imgSrc}" data-teacherId="${course.teacherId}">
                    <div class="position-relative" style="height: 50%; overflow: hidden;">
                        <img src="${imgSrc}" class="w-100 h-100 object-fit-cover" alt="课程图片">
                        <div class="position-absolute bottom-0 start-0 w-100 px-2 py-1 bg-dark bg-opacity-50 text-white small text-center">
                            ${course.semester} | ${course.courseCode}
                        </div>
                    </div>
                    <div class="d-flex flex-column justify-content-between p-3 card-body-custom" style="height: 50%;">
                        <h5 class="text-center text-truncate mb-1">${course.courseName}</h5>
                        <p class="text-muted text-center small mb-1">学院：${course.college}</p>
                        <p class="text-muted text-center small mb-2">${course.teacherName}</p>
                        <div class="d-flex justify-content-between text-muted small px-2">
                            <span><i class="bi bi-clock"></i> ${course.totalHours || 0} 学时</span>
                            <span><i class="bi bi-award"></i> ${course.credit || 0} 学分</span>
                        </div>
                    </div>
                </div>
            `;

            card.querySelector('.feature-card').addEventListener('click', function () {
                const courseId = this.getAttribute("data-id");
                const imgSrc = this.getAttribute('data-img');
                const teacherId = this.getAttribute("data-teacherId");
                const encodedImg = encodeURIComponent(imgSrc);

                window.location.href = `/大雅之堂/Web/html/course.html?courseId=${courseId}&teacherId=${teacherId}&img=${encodedImg}`;
            });


            container.appendChild(card);
        });
    }

    // 页面初始加载第一页
    fetchAndRender();
});
//发现
document.addEventListener('DOMContentLoaded', function () {
    const token = sessionStorage.getItem('Token');
    if (!token) return;

    const container = document.querySelector('.feature-section-2 .container .row');
    const paginationWrapper = document.createElement('div');
    paginationWrapper.className = 'd-flex justify-content-end mt-3';
    container.parentElement.appendChild(paginationWrapper);

    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;
    let totalItems = 0;
    let currentKeyword = '';

    // 添加搜索框和按钮
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'd-flex justify-content-end mb-3';

    searchWrapper.innerHTML = `
        <input type="text" class="form-control form-control-sm w-25 me-2" placeholder="搜索课程" id="searchInput">
        <button class="btn btn-primary btn-sm" id="searchBtn">查询</button>
    `;
    container.parentElement.insertBefore(searchWrapper, container);

    document.getElementById('searchBtn').addEventListener('click', async function () {
        currentKeyword = document.getElementById('searchInput').value.trim();
        currentPage = 1; // 搜索时重置页码
        await fetchAndRender();
    });
    document.getElementById('searchInput').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    function renderPagination() {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        paginationWrapper.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline-primary btn-sm me-2';
        prevBtn.textContent = '上一页';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAndRender();
            }
        };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline-primary btn-sm ms-2';
        nextBtn.textContent = '下一页';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchAndRender();
            }
        };

        const info = document.createElement('span');
        info.className = 'align-self-center';
        info.textContent = `第 ${currentPage} / ${totalPages || 1} 页`;

        paginationWrapper.appendChild(prevBtn);
        paginationWrapper.appendChild(info);
        paginationWrapper.appendChild(nextBtn);
    }

    async function fetchAndRender() {
        container.innerHTML = ''; // 清空原有卡片
        console.log('请求地址:', API.COURSE_LIST);
        try {
            const res = await fetch(API.COURSE_LIST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    pageNo: currentPage,
                    pageSize: ITEMS_PER_PAGE,
                    name: currentKeyword || undefined,
                })
            });

            const result = await res.json();

            if (result.code === 1 && result.data) {
                const { total, records } = result.data;
                totalItems = total;

                if (records.length === 0) {
                    container.innerHTML = `<p class="text-muted font-bond">未找到相关课程</p>`;
                } else {
                    renderCourses(records);
                }

                renderPagination();
            } else {
                container.innerHTML = `<p class="text-danger">加载课程失败</p>`;
            }
        } catch (err) {
            console.error('获取课程失败:', err);
            container.innerHTML = `<p class="text-danger">获取课程失败</p>`;
        }
    }

    function PersistentRandomImage(courseId) {
        const storageKey = 'courseImageMap';
        const imgCount = 8;
        const key = String(courseId);

        let imageMap = {};
        const storedMap = localStorage.getItem(storageKey);
        if (storedMap) {
            try {
                imageMap = JSON.parse(storedMap);
            } catch (e) {
                imageMap = {};
            }
        }

        if (imageMap[key]) {
            return `/大雅之堂/Web/assets/course${imageMap[key]}.png`;
        }

        const randomIndex = Math.floor(Math.random() * imgCount) + 1;
        imageMap[key] = randomIndex;
        localStorage.setItem(storageKey, JSON.stringify(imageMap));

        return `/大雅之堂/Web/assets/course${randomIndex}.png`;
    }



    function renderCourses(records) {
        records.forEach(course => {
            const imgCount = 8;
            const imgSrc=PersistentRandomImage(course.id);

            const card = document.createElement('div');
            card.className = 'col-md-3 mb-4';

            card.innerHTML = `
                <div class="feature-card h-100 shadow-sm position-relative" style="aspect-ratio: 1/1; cursor:pointer;"
                 data-id="${course.id}" data-img="${imgSrc}" data-teacherId="${course.teacherId}">
                    <div class="position-relative" style="height: 50%; overflow: hidden;">
                        <img src="${imgSrc}" class="w-100 h-100 object-fit-cover" alt="课程图片">
                        <div class="position-absolute bottom-0 start-0 w-100 px-2 py-1 bg-dark bg-opacity-50 text-white small text-center">
                            ${course.semester} | ${course.courseCode}
                        </div>
                    </div>
                    <div class="d-flex flex-column justify-content-between p-3 card-body-custom" style="height: 50%;">
                        <h5 class="text-center text-truncate mb-1">${course.courseName}</h5>
                        <p class="text-muted text-center small mb-1">学院：${course.college}</p>
                        <p class="text-muted text-center small mb-2">${course.teacherName}</p>
                        <div class="d-flex justify-content-between text-muted small px-2">
                            <span><i class="bi bi-clock"></i> ${course.totalHours || 0} 学时</span>
                            <span><i class="bi bi-award"></i> ${course.credit || 0} 学分</span>
                        </div>
                    </div>
                </div>
            `;

            card.querySelector('.feature-card').addEventListener('click', async function () {
                const courseId = this.getAttribute("data-id");
                const imgSrc = this.getAttribute('data-img');
                const teacherId = this.getAttribute("data-teacherId");
                const encodedImg = encodeURIComponent(imgSrc);
                const token = sessionStorage.getItem('Token');

                const url = API.JOIN_COURSE+`${courseId}`;
                console.log('加入课程请求 URL:', url);

                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        }
                    });

                    const result = await res.json();
                    console.log('加入课程返回结果:', result);

                    if (result.code === 1) {
                        alert('加入成功！');
                    } else {
                        alert('加入失败：' + (result.msg || '你可能已经加入该课程'));
                    }
                } catch (err) {
                    console.error('加入课程失败:', err);
                    alert('服务器错误，加入课程失败');
                }
            });



            container.appendChild(card);
        });
    }

    // 页面初始加载第一页
    fetchAndRender();
});

// 退出登录
document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('Token');
            window.location.href = 'log.html';
        });
    }
});

//首页图片
const slides=document.getElementById("slides");
const dots=document.querySelectorAll('.dot');
const totalSlides=dots.length;
let currentIndex = 0;
let interval=setInterval(nextSlide,3000)

function nextSlide(){
    const next=(currentIndex+1)% totalSlides;
    showSlide(next);
}

function showSlide(index){
    slides.style.transform = `translateX(-${index*100}%)`;
    dots.forEach((dot,i)=>{
        dot.classList.toggle("active",i===index);
    });
    currentIndex = index;
}

function prevSlide(){
    const prev=(currentIndex-1+totalSlides)%totalSlides;
    showSlide(prev);
}

document.querySelector(".next").addEventListener("click", () => {
    nextSlide();
    resetInterval();
});

document.querySelector(".prev").addEventListener("click", () => {
    prevSlide();
    resetInterval();
});

function resetInterval(){
    clearInterval(interval);
    interval=setInterval(nextSlide,3000);
}

dots.forEach((dot,i)=>{
    dot.addEventListener("click", ()=>{
        showSlide(i);
        resetInterval();
    })
})

window.addEventListener('storage', function(e) {
    if (e.key === 'activeUserId') {
        // 其它标签页切换了用户，这里可以刷新页面或弹出提示
        window.location.reload();
    }
});
