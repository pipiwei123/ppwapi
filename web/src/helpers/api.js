import { getUserIdFromLocalStorage, showError, formatMessageForAPI, isValidMessage } from './utils';
import axios from 'axios';
import { MESSAGE_ROLES } from '../constants/playground.constants';

export let API = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL
    ? import.meta.env.VITE_REACT_APP_SERVER_URL
    : '',
  withCredentials: true, // 重要：发送 session cookies
  headers: {
    'New-API-User': getUserIdFromLocalStorage(),
    'Cache-Control': 'no-store',
  },
});

function patchAPIInstance(instance) {
  const originalGet = instance.get.bind(instance);
  const inFlightGetRequests = new Map();

  const genKey = (url, config = {}) => {
    const params = config.params ? JSON.stringify(config.params) : '{}';
    return `${url}?${params}`;
  };

  instance.get = (url, config = {}) => {
    if (config?.disableDuplicate) {
      return originalGet(url, config);
    }

    const key = genKey(url, config);
    if (inFlightGetRequests.has(key)) {
      return inFlightGetRequests.get(key);
    }

    const reqPromise = originalGet(url, config).finally(() => {
      inFlightGetRequests.delete(key);
    });

    inFlightGetRequests.set(key, reqPromise);
    return reqPromise;
  };
}

patchAPIInstance(API);

export function updateAPI() {
  API = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL
      ? import.meta.env.VITE_REACT_APP_SERVER_URL
      : '',
    headers: {
      'New-API-User': getUserIdFromLocalStorage(),
      'Cache-Control': 'no-store',
    },
  });

  patchAPIInstance(API);
}

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果请求配置中显式要求跳过全局错误处理，则不弹出默认错误提示
    if (error.config && error.config.skipErrorHandler) {
      return Promise.reject(error);
    }
    showError(error);
    return Promise.reject(error);
  },
);

// playground

// 构建API请求负载
export const buildApiPayload = (messages, systemPrompt, inputs, parameterEnabled) => {
  const processedMessages = messages
    .filter(isValidMessage)
    .map(formatMessageForAPI)
    .filter(Boolean);

  // 如果有系统提示，插入到消息开头
  if (systemPrompt && systemPrompt.trim()) {
    processedMessages.unshift({
      role: MESSAGE_ROLES.SYSTEM,
      content: systemPrompt.trim()
    });
  }

  // 验证并清理分组值 - 确保不是数字ID
  let validGroup = inputs.group || '';
  if (/^\d+$/.test(validGroup)) {
    // 如果分组值是纯数字（可能是令牌ID），重置为空字符串
    console.info('检测到无效的分组值（数字ID）:', validGroup, '已重置为空字符串');
    validGroup = '';
  }

  const payload = {
    model: inputs.model,
    group: validGroup,
    messages: processedMessages,
    stream: inputs.stream,
  };

  // 添加启用的参数
  const parameterMappings = {
    temperature: 'temperature',
    top_p: 'top_p',
    max_tokens: 'max_tokens',
    frequency_penalty: 'frequency_penalty',
    presence_penalty: 'presence_penalty',
    seed: 'seed'
  };

  Object.entries(parameterMappings).forEach(([key, param]) => {
    if (parameterEnabled[key] && inputs[param] !== undefined && inputs[param] !== null) {
      payload[param] = inputs[param];
    }
  });

  return payload;
};

// 处理API错误响应
export const handleApiError = (error, response = null) => {
  const errorInfo = {
    error: error.message || '未知错误',
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  if (response) {
    errorInfo.status = response.status;
    errorInfo.statusText = response.statusText;
  }

  if (error.message.includes('HTTP error')) {
    errorInfo.details = '服务器返回了错误状态码';
  } else if (error.message.includes('Failed to fetch')) {
    errorInfo.details = '网络连接失败或服务器无响应';
  }

  return errorInfo;
};

// 处理模型数据
export const processModelsData = (data, currentModel) => {
  const modelOptions = data.map(model => ({
    label: model,
    value: model,
  }));

  const hasCurrentModel = modelOptions.some(option => option.value === currentModel);
  const selectedModel = hasCurrentModel && modelOptions.length > 0
    ? currentModel
    : modelOptions[0]?.value;

  return { modelOptions, selectedModel };
};

// 处理分组数据
export const processGroupsData = (data, userGroup) => {
  // 检查数据格式 - 如果是数组，直接处理；如果是对象，转换为数组格式
  let groupArray = [];
  
  if (Array.isArray(data)) {
    // 新格式：后端返回已排序的数组
    groupArray = data;
  } else {
    // 旧格式：对象格式，转换为数组
    groupArray = Object.entries(data).map(([group, info]) => ({
      name: group,
      desc: info.desc || group,
      ratio: info.ratio || 1,
      priority: info.priority || 999,
    }));
  }

  let groupOptions = groupArray.map((groupInfo) => ({
    label: groupInfo.name, // 使用分组名称作为主要显示
    value: groupInfo.name, // 使用分组名称作为值
    desc: groupInfo.desc, // 描述作为副标题
    ratio: groupInfo.ratio,
    priority: groupInfo.priority,
    fullLabel: groupInfo.desc,
  }));

  if (groupOptions.length === 0) {
    groupOptions = [{
      label: '用户分组',
      value: '',
      ratio: 1,
      priority: 999,
    }];
  }

  // 按优先级排序（数字越小优先级越高）
  groupOptions.sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return groupOptions;
};

// 原来components中的utils.js

export async function getOAuthState() {
  let path = '/api/oauth/state';
  let affCode = localStorage.getItem('aff');
  if (affCode && affCode.length > 0) {
    path += `?aff=${affCode}`;
  }
  const res = await API.get(path);
  const { success, message, data } = res.data;
  if (success) {
    return data;
  } else {
    showError(message);
    return '';
  }
}

export async function onOIDCClicked(auth_url, client_id, openInNewTab = false) {
  const state = await getOAuthState();
  if (!state) return;
  const redirect_uri = `${window.location.origin}/oauth/oidc`;
  const response_type = 'code';
  const scope = 'openid profile email';
  const url = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}`;
  if (openInNewTab) {
    window.open(url);
  } else {
    window.location.href = url;
  }
}

export async function onGitHubOAuthClicked(github_client_id) {
  const state = await getOAuthState();
  if (!state) return;
  window.open(
    `https://github.com/login/oauth/authorize?client_id=${github_client_id}&state=${state}&scope=user:email`,
  );
}

export async function onLinuxDOOAuthClicked(linuxdo_client_id) {
  const state = await getOAuthState();
  if (!state) return;
  window.open(
    `https://connect.linux.do/oauth2/authorize?response_type=code&client_id=${linuxdo_client_id}&state=${state}`,
  );
}

export async function onGoogleOAuthClicked(google_client_id) {
  const state = await getOAuthState();
  if (!state) return;
  
  window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${google_client_id}&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/google')}&state=${state}&scope=openid%20email%20profile`,
  );
}

let channelModels = undefined;
export async function loadChannelModels() {
  const res = await API.get('/api/models');
  const { success, data } = res.data;
  if (!success) {
    return;
  }
  channelModels = data;
  localStorage.setItem('channel_models', JSON.stringify(data));
}

export function getChannelModels(type) {
  if (channelModels !== undefined && type in channelModels) {
    if (!channelModels[type]) {
      return [];
    }
    return channelModels[type];
  }
  let models = localStorage.getItem('channel_models');
  if (!models) {
    return [];
  }
  channelModels = JSON.parse(models);
  if (type in channelModels) {
    return channelModels[type];
  }
  return [];
}
