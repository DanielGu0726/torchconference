import { ok } from '../../_lib/util.js';

// 세션 유효성 확인 (미들웨어를 통과했다면 유효)
export const onRequestGet = ({ data }) => ok({ admin: data.admin || null });
