const API_BASE = 'http://172.20.10.7:8000';
//const API_BASE='http://192.168.97.224:8000';

const API = {
    COURSE_NUMBER: API_BASE + '/student/course/number',
    COURSE_TITLE: API_BASE + '/student/course/title',
    LOGIN: API_BASE + '/student/login',
    REGISTER: API_BASE + '/student/login/register',
    COURSE_LIST: API_BASE + '/student/course/list',
    COURSE_FILE: API_BASE + '/student/course/files/',//http://localhost:8000/student/course/files/101/1
    COURSE_TASK: API_BASE + '/student/course/task?courseId=',//http://localhost:8000/student/course/task?courseId=1
    GROUP_LIST: API_BASE + '/student/course/group/list?courseId=',
    GROUP_IN:API_BASE+'/student/course/group?groupId=',//http://localhost:8000/student/course/group?groupId=1001&remark=
    MYSELF: API_BASE + '/student/myself/get/myself',//http://localhost:8000/student/myself/get/myself
    MYSELF_UPDATE: API_BASE + '/student/myself/update',
    UPDATE_CODE: API_BASE + '/student/myself/update/code',
    COURSE_GRADE: API_BASE + '/student/course/grade',
    SEND_CODE:API_BASE+'/student/myself/send/micode?email=',
    ADD_GROUP: API_BASE + '/student/course/add/group',
    GAT_IN_GROUP:API_BASE + '/student/course/get/inGroup?courseId=',
    JOIN_COURSE: API_BASE + '/student/course/join?courseId=',
};