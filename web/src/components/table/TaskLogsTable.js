import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Music,
  FileText,
  HelpCircle,
  CheckCircle,
  Pause,
  Clock,
  Play,
  XCircle,
  Loader,
  List,
  Hash,
  Video,
  Sparkles,
  Volume2,
  Download,
  Image as ImageIcon,
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import {
  API,
  copy,
  isAdmin, renderNumber, renderQuota,
  showError,
  showSuccess, stringToColor,
  timestamp2string
} from '../../helpers';

import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Divider,
  Empty,
  Form,
  Image,
  Layout,
  Modal,
  Progress,
  Table,
  Tag,
  Typography
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark
} from '@douyinfe/semi-illustrations';
import { ITEMS_PER_PAGE } from '../../constants';
import {
  IconEyeOpened,
  IconSearch,
} from '@douyinfe/semi-icons';
import { useTableCompactMode } from '../../hooks/useTableCompactMode';
import { TASK_ACTION_GENERATE, TASK_ACTION_TEXT_GENERATE } from '../../constants/common.constant';

const { Text } = Typography;

const colors = [
  'amber',
  'blue',
  'cyan',
  'green',
  'grey',
  'indigo',
  'light-blue',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'violet',
  'yellow',
];

// 定义列键值常量
const COLUMN_KEYS = {
  SUBMIT_TIME: 'submit_time',
  USERNAME: 'username',
  TOKEN_NAME: 'token_name',
  FINISH_TIME: 'finish_time',
  DURATION: 'duration',
  CHANNEL: 'channel',
  PLATFORM: 'platform',
  TYPE: 'type',
  TASK_ID: 'task_id',
  TASK_STATUS: 'task_status',
  PROGRESS: 'progress',
  FAIL_REASON: 'fail_reason',
  RESULT_URL: 'result_url',
};

const renderTimestamp = (timestampInSeconds) => {
  const date = new Date(timestampInSeconds * 1000); // 从秒转换为毫秒

  const year = date.getFullYear(); // 获取年份
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // 获取月份，从0开始需要+1，并保证两位数
  const day = ('0' + date.getDate()).slice(-2); // 获取日期，并保证两位数
  const hours = ('0' + date.getHours()).slice(-2); // 获取小时，并保证两位数
  const minutes = ('0' + date.getMinutes()).slice(-2); // 获取分钟，并保证两位数
  const seconds = ('0' + date.getSeconds()).slice(-2); // 获取秒钟，并保证两位数

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // 格式化输出
};

function renderDuration(submit_time, finishTime) {
  if (!submit_time || !finishTime) return 'N/A';
  const durationSec = finishTime - submit_time;
  const color = durationSec > 60 ? 'red' : 'green';

  // 返回带有样式的颜色标签
  return (
    <Tag color={color} prefixIcon={<Clock size={14} />}>
      {durationSec} 秒
    </Tag>
  );
}

const LogsTable = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  // 列可见性状态
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const isAdminUser = isAdmin();
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  // 音乐播放组件相关状态
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [audioRef, setAudioRef] = useState(null);

  // 图片预览相关状态
  const [previewImageVisible, setPreviewImageVisible] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState('');

  // 视频播放相关状态
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoRef, setCurrentVideoRef] = useState(null);

  // 加载保存的列偏好设置
  useEffect(() => {
    const savedColumns = localStorage.getItem('task-logs-table-columns');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        const defaults = getDefaultColumnVisibility();
        const merged = { ...defaults, ...parsed };
        setVisibleColumns(merged);
      } catch (e) {
        console.error('Failed to parse saved column preferences', e);
        initDefaultColumns();
      }
    } else {
      initDefaultColumns();
    }
  }, []);

  // 获取默认列可见性
  const getDefaultColumnVisibility = () => {
    return {
      [COLUMN_KEYS.SUBMIT_TIME]: true,
      [COLUMN_KEYS.USERNAME]: isAdminUser,
      [COLUMN_KEYS.TOKEN_NAME]: true,
      [COLUMN_KEYS.FINISH_TIME]: true,
      [COLUMN_KEYS.DURATION]: true,
      [COLUMN_KEYS.CHANNEL]: isAdminUser,
      [COLUMN_KEYS.PLATFORM]: true,
      [COLUMN_KEYS.TYPE]: true,
      [COLUMN_KEYS.TASK_ID]: true,
      [COLUMN_KEYS.TASK_STATUS]: true,
      [COLUMN_KEYS.PROGRESS]: true,
      [COLUMN_KEYS.FAIL_REASON]: true,
      [COLUMN_KEYS.RESULT_URL]: true,
    };
  };

  // 初始化默认列可见性
  const initDefaultColumns = () => {
    const defaults = getDefaultColumnVisibility();
    setVisibleColumns(defaults);
    localStorage.setItem('task-logs-table-columns', JSON.stringify(defaults));
  };

  // 处理列可见性变化
  const handleColumnVisibilityChange = (columnKey, checked) => {
    const updatedColumns = { ...visibleColumns, [columnKey]: checked };
    setVisibleColumns(updatedColumns);
  };

  // 处理全选
  const handleSelectAll = (checked) => {
    const allKeys = Object.keys(COLUMN_KEYS).map((key) => COLUMN_KEYS[key]);
    const updatedColumns = {};

    allKeys.forEach((key) => {
      if (key === COLUMN_KEYS.CHANNEL && !isAdminUser) {
        updatedColumns[key] = false;
      } else {
        updatedColumns[key] = checked;
      }
    });

    setVisibleColumns(updatedColumns);
  };

  // 更新表格时保存列可见性
  useEffect(() => {
    if (Object.keys(visibleColumns).length > 0) {
      localStorage.setItem('task-logs-table-columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const renderType = (type) => {
    switch (type) {
      case 'MUSIC':
        return (
          <Tag color='grey' shape='circle' prefixIcon={<Music size={14} />}>
            {t('生成音乐')}
          </Tag>
        );
      case 'LYRICS':
        return (
          <Tag color='pink' shape='circle' prefixIcon={<FileText size={14} />}>
            {t('生成歌词')}
          </Tag>
        );
      case TASK_ACTION_GENERATE:
        return (
          <Tag color='blue' shape='circle' prefixIcon={<Sparkles size={14} />}>
            {t('图生视频')}
          </Tag>
        );
      case TASK_ACTION_TEXT_GENERATE:
        return (
          <Tag color='blue' shape='circle' prefixIcon={<Sparkles size={14} />}>
            {t('文生视频')}
          </Tag>
        );
      default:
        return (
          <Tag color='white' shape='circle' prefixIcon={<HelpCircle size={14} />}>
            {t('未知')}
          </Tag>
        );
    }
  };

  const renderPlatform = (platform) => {
    switch (platform) {
      case 'suno':
        return (
          <Tag color='green' shape='circle' prefixIcon={<Music size={14} />}>
            Suno
          </Tag>
        );
      case 'kling':
        return (
          <Tag color='orange' shape='circle' prefixIcon={<Video size={14} />}>
            Kling
          </Tag>
        );
      case 'jimeng':
        return (
          <Tag color='purple' shape='circle' prefixIcon={<Video size={14} />}>
            Jimeng
          </Tag>
        );
      default:
        return (
          <Tag color='white' shape='circle' prefixIcon={<HelpCircle size={14} />}>
            {t('未知')}
          </Tag>
        );
    }
  };

  const renderStatus = (type) => {
    switch (type) {
      case 'SUCCESS':
        return (
          <Tag color='green' shape='circle' prefixIcon={<CheckCircle size={14} />}>
            {t('成功')}
          </Tag>
        );
      case 'NOT_START':
        return (
          <Tag color='grey' shape='circle' prefixIcon={<Pause size={14} />}>
            {t('未启动')}
          </Tag>
        );
      case 'SUBMITTED':
        return (
          <Tag color='yellow' shape='circle' prefixIcon={<Clock size={14} />}>
            {t('队列中')}
          </Tag>
        );
      case 'IN_PROGRESS':
        return (
          <Tag color='blue' shape='circle' prefixIcon={<Play size={14} />}>
            {t('执行中')}
          </Tag>
        );
      case 'FAILURE':
        return (
          <Tag color='red' shape='circle' prefixIcon={<XCircle size={14} />}>
            {t('失败')}
          </Tag>
        );
      case 'QUEUED':
        return (
          <Tag color='orange' shape='circle' prefixIcon={<List size={14} />}>
            {t('排队中')}
          </Tag>
        );
      case 'UNKNOWN':
        return (
          <Tag color='white' shape='circle' prefixIcon={<HelpCircle size={14} />}>
            {t('未知')}
          </Tag>
        );
      case '':
        return (
          <Tag color='grey' shape='circle' prefixIcon={<Loader size={14} />}>
            {t('正在提交')}
          </Tag>
        );
      default:
        return (
          <Tag color='white' shape='circle' prefixIcon={<HelpCircle size={14} />}>
            {t('未知')}
          </Tag>
        );
    }
  };

  const showUserInfo = async (userId) => {
    if (!isAdminUser) {
      return;
    }
    const res = await API.get(`/api/user/${userId}`);
    const { success, message, data } = res.data;
    if (success) {
      Modal.info({
        title: t('用户信息'),
        content: (
            <div style={{ padding: 12 }}>
              <p>
                {t('用户名')}: {data.username}
              </p>
              <p>
                {t('余额')}: {renderQuota(data.quota)}
              </p>
              <p>
                {t('已用额度')}：{renderQuota(data.used_quota)}
              </p>
              <p>
                {t('请求次数')}：{renderNumber(data.request_count)}
              </p>
            </div>
        ),
        centered: true,
      });
    } else {
      showError(message);
    }
  };

  // 定义所有列
  const allColumns = [
    {
      key: COLUMN_KEYS.SUBMIT_TIME,
      title: t('提交时间'),
      dataIndex: 'submit_time',
      render: (text, record, index) => {
        return <div>{text ? renderTimestamp(text) : '-'}</div>;
      },
    },
    {
      key: COLUMN_KEYS.USERNAME,
      title: t('用户'),
      dataIndex: 'username',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return isAdminUser ? (
            <div>
              <Avatar
                  size='extra-small'
                  color={stringToColor(text)}
                  style={{ marginRight: 4 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    showUserInfo(record.user_id);
                  }}
              >
                {typeof text === 'string' && text.slice(0, 1)}
              </Avatar>
              {text}
            </div>
        ) : (
            <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.TOKEN_NAME,
      title: t('令牌'),
      dataIndex: 'token_name',
      render: (text, record, index) => {
        return (
            <div>
              <Tag
                color='grey'
                shape='circle'
                onClick={(event) => {
                  //cancel the row click event
                  copyText(text);
                }}
              >
                {' '}
                {t(text)}{' '}
              </Tag>
            </div>
        );
      },
    },
    {
      key: COLUMN_KEYS.FINISH_TIME,
      title: t('结束时间'),
      dataIndex: 'finish_time',
      render: (text, record, index) => {
        return <div>{text ? renderTimestamp(text) : '-'}</div>;
      },
    },
    {
      key: COLUMN_KEYS.DURATION,
      title: t('花费时间'),
      dataIndex: 'finish_time',
      render: (finish, record) => {
        return <>{finish ? renderDuration(record.submit_time, finish) : '-'}</>;
      },
    },
    {
      key: COLUMN_KEYS.CHANNEL,
      title: t('渠道'),
      dataIndex: 'channel_id',
      className: isAdminUser ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return isAdminUser ? (
          <div>
            <Tag
              color={colors[parseInt(text) % colors.length]}
              size='large'
              shape='circle'
              prefixIcon={<Hash size={14} />}
              onClick={() => {
                copyText(text);
              }}
            >
              {text}
            </Tag>
          </div>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.PLATFORM,
      title: t('平台'),
      dataIndex: 'platform',
      render: (text, record, index) => {
        return <div>{renderPlatform(text)}</div>;
      },
    },
    {
      key: COLUMN_KEYS.TYPE,
      title: t('类型'),
      dataIndex: 'action',
      render: (text, record, index) => {
        return <div>{renderType(text)}</div>;
      },
    },
    {
      key: COLUMN_KEYS.TASK_ID,
      title: t('任务ID'),
      dataIndex: 'task_id',
      render: (text, record, index) => {
        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            onClick={() => {
              setModalContent(JSON.stringify(record, null, 2));
              setIsModalOpen(true);
            }}
          >
            <div>{text}</div>
          </Typography.Text>
        );
      },
    },
    {
      key: COLUMN_KEYS.TASK_STATUS,
      title: t('任务状态'),
      dataIndex: 'status',
      render: (text, record, index) => {
        return <div>{renderStatus(text)}</div>;
      },
    },
    {
      key: COLUMN_KEYS.PROGRESS,
      title: t('进度'),
      dataIndex: 'progress',
      render: (text, record, index) => {
        return (
          <div>
            {
              isNaN(text?.replace('%', '')) ? (
                text || '-'
              ) : (
                <Progress
                  stroke={
                    record.status === 'FAILURE'
                      ? 'var(--semi-color-warning)'
                      : null
                  }
                  percent={text ? parseInt(text.replace('%', '')) : 0}
                  showInfo={true}
                  aria-label='task progress'
                  style={{ minWidth: '160px' }}
                />
              )
            }
          </div>
        );
      },
    },
    {
      key: COLUMN_KEYS.FAIL_REASON,
      title: t('详情'),
      dataIndex: 'fail_reason',
      fixed: 'right',
      render: (text, record, index) => {
        const isVideoTask = record.action === TASK_ACTION_GENERATE || record.action === TASK_ACTION_TEXT_GENERATE;
        const isMusicTask = record.action === 'MUSIC';
        const isSuccess = record.status === 'SUCCESS';
        const isUrl = typeof text === 'string' && /^https?:\/\//.test(text);

        // 音乐任务且成功
        if (isSuccess && isMusicTask) {
          const musicUrls = getMusicUrls(record);
          
          if (musicUrls?.audio_url) {
            const isPlaying = currentPlayingId === record.task_id;
            
            return (
              <div className="flex gap-2 items-center">
                {/* 缩略图显示 */}
                {musicUrls.image_url && (
                  <div className="flex-shrink-0">
                    <div 
                      style={{ 
                        width: '60px', 
                        height: '60px',
                        position: 'relative',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid #e5e5e5'
                      }}
                    >
                      <img
                        src={musicUrls.image_url}
                        alt={musicUrls.title || t('音乐封面')}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `
                            <div style="
                              width: 100%; 
                              height: 100%; 
                              display: flex; 
                              align-items: center; 
                              justify-content: center; 
                              background: #f5f5f5; 
                              color: #999;
                              font-size: 12px;
                            ">
                              封面加载失败
                            </div>
                          `;
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* 控制按钮组 */}
                <div className="flex gap-1 flex-wrap">
                  <Button
                    size="small"
                    type={isPlaying ? "primary" : "tertiary"}
                    icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    onClick={() => toggleAudioPlay(record)}
                    title={isPlaying ? t('暂停播放') : t('播放音乐')}
                  >
                    {isPlaying ? t('暂停') : t('播放')}
                  </Button>
                  
                  {musicUrls.audio_url && (
                    <Button
                      size="small"
                      type="tertiary"
                      icon={<Download size={14} />}
                      onClick={() => window.open(musicUrls.audio_url, '_blank')}
                      title={t('下载音频')}
                    />
                  )}
                  
                  {musicUrls.video_url && (
                    <Button
                      size="small"
                      type="tertiary"
                      icon={<Video size={14} />}
                      onClick={() => window.open(musicUrls.video_url, '_blank')}
                      title={t('查看视频')}
                    />
                  )}
                </div>
              </div>
            );
          }
        }

        // 视频生成任务且成功
        if (isSuccess && isVideoTask) {
          const videoUrls = getVideoUrls(record);
          
          if (videoUrls?.video_url) {
            return (
              <div className="flex gap-2 items-center">
                {/* 视频缩略图 */}
                <div className="flex-shrink-0">
                  <div 
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      position: 'relative',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #e5e5e5',
                      background: '#f5f5f5',
                      cursor: 'pointer'
                    }}
                    onClick={() => showVideoPlayer(videoUrls.video_url)}
                    title={t('点击播放视频')}
                  >
                    <video
                      src={videoUrls.video_url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      muted
                      preload="metadata"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `
                          <div style="
                            width: 100%; 
                            height: 100%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            background: #f5f5f5; 
                            color: #999;
                            font-size: 12px;
                            flex-direction: column;
                          ">
                            <div style="font-size: 16px; margin-bottom: 2px;">🎬</div>
                            <div>视频</div>
                          </div>
                        `;
                      }}
                    />
                    {/* 播放覆盖层 */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                      }}
                    >
                      <PlayCircle size={24} />
                    </div>
                  </div>
                </div>
                
                {/* 控制按钮组 */}
                <div className="flex gap-1 flex-wrap">
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlayCircle size={14} />}
                    onClick={() => showVideoPlayer(videoUrls.video_url)}
                    title={t('播放视频')}
                  >
                    {t('播放')}
                  </Button>
                  
                  <Button
                    size="small"
                    type="tertiary"
                    icon={<ExternalLink size={14} />}
                    onClick={() => window.open(videoUrls.video_url, '_blank')}
                    title={t('在新窗口打开')}
                  />
                  
                  <Button
                    size="small"
                    type="tertiary"
                    icon={<Download size={14} />}
                    onClick={() => window.open(videoUrls.video_url, '_blank')}
                    title={t('下载视频')}
                  />
                </div>
              </div>
            );
          }
          
          // 如果有URL但不在预期字段中，显示原有的链接
          if (isUrl) {
            return (
              <a href={text} target="_blank" rel="noopener noreferrer">
                {t('点击预览视频')}
              </a>
            );
          }
        }
        
        if (!text) {
          return t('无');
        }
        
        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              setModalContent(text);
              setIsModalOpen(true);
            }}
          >
            {text}
          </Typography.Text>
        );
      },
    },
  ];

  // 根据可见性设置过滤列
  const getVisibleColumns = () => {
    return allColumns.filter((column) => visibleColumns[column.key]);
  };

  const [activePage, setActivePage] = useState(1);
  const [logCount, setLogCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [compactMode, setCompactMode] = useTableCompactMode('taskLogs');

  useEffect(() => {
    const localPageSize = parseInt(localStorage.getItem('task-page-size')) || ITEMS_PER_PAGE;
    setPageSize(localPageSize);
    loadLogs(1, localPageSize).then();
  }, []);

  // 清理音频播放器
  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause();
        setCurrentPlayingId(null);
      }
    };
  }, [audioRef]);

  // 视频清理 useEffect
  useEffect(() => {
    return () => {
      if (currentVideoRef) {
        currentVideoRef.pause();
        setCurrentVideoRef(null);
      }
    };
  }, [currentVideoRef]);

  let now = new Date();
  // 初始化start_timestamp为前一天
  let zeroNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Form 初始值
  const formInitValues = {
    channel_id: '',
    task_id: '',
    dateRange: [
      timestamp2string(zeroNow.getTime() / 1000),
      timestamp2string(now.getTime() / 1000 + 3600)
    ],
  };

  // Form API 引用
  const [formApi, setFormApi] = useState(null);

  // 获取表单值的辅助函数
  const getFormValues = () => {
    const formValues = formApi ? formApi.getValues() : {};

    // 处理时间范围
    let start_timestamp = timestamp2string(zeroNow.getTime() / 1000);
    let end_timestamp = timestamp2string(now.getTime() / 1000 + 3600);

    if (formValues.dateRange && Array.isArray(formValues.dateRange) && formValues.dateRange.length === 2) {
      start_timestamp = formValues.dateRange[0];
      end_timestamp = formValues.dateRange[1];
    }

    return {
      channel_id: formValues.channel_id || '',
      task_id: formValues.task_id || '',
      start_timestamp,
      end_timestamp,
    };
  };

  const enrichLogs = (items) => {
    return items.map((log) => ({
      ...log,
      timestamp2string: timestamp2string(log.created_at),
      key: '' + log.id,
    }));
  };

  const syncPageData = (payload) => {
    const items = enrichLogs(payload.items || []);
    setLogs(items);
    setLogCount(payload.total || 0);
    setActivePage(payload.page || 1);
    setPageSize(payload.page_size || pageSize);
  };

  const loadLogs = async (page = 1, size = pageSize) => {
    setLoading(true);
    const { channel_id, task_id, start_timestamp, end_timestamp } = getFormValues();
    let localStartTimestamp = parseInt(Date.parse(start_timestamp) / 1000);
    let localEndTimestamp = parseInt(Date.parse(end_timestamp) / 1000);
    let url = isAdminUser
      ? `/api/task/?p=${page}&page_size=${size}&channel_id=${channel_id}&task_id=${task_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`
      : `/api/task/self?p=${page}&page_size=${size}&task_id=${task_id}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      syncPageData(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const pageData = logs;

  const handlePageChange = (page) => {
    loadLogs(page, pageSize).then();
  };

  const handlePageSizeChange = async (size) => {
    localStorage.setItem('task-page-size', size + '');
    await loadLogs(1, size);
  };

  const refresh = async () => {
    await loadLogs(1, pageSize);
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess(t('已复制：') + text);
    } else {
      Modal.error({ title: t('无法复制到剪贴板，请手动复制'), content: text });
    }
  };

  // 音乐播放相关函数
  const parseTaskData = (record) => {
    if (!record.data) return null;
    try {
      const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
      return data;
    } catch (e) {
      console.warn('Failed to parse task data:', e);
      return null;
    }
  };

  const getMusicUrls = (record) => {
    const data = parseTaskData(record);
    if (!data) return null;

    // 支持多种数据格式
    if (Array.isArray(data)) {
      // 数组格式，取第一个元素
      const firstItem = data[0];
      return {
        audio_url: firstItem?.audio_url,
        video_url: firstItem?.video_url,
        image_url: firstItem?.image_url || firstItem?.image_large_url,
        title: firstItem?.title
      };
    } else if (data.audio_url) {
      // 直接包含 audio_url 的格式
      return {
        audio_url: data.audio_url,
        video_url: data.video_url,
        image_url: data.image_url || data.image_large_url,
        title: data.title
      };
    }
    return null;
  };

  const toggleAudioPlay = (record) => {
    const musicUrls = getMusicUrls(record);
    if (!musicUrls?.audio_url) return;

    if (currentPlayingId === record.task_id) {
      // 暂停当前播放
      if (audioRef) {
        audioRef.pause();
        setCurrentPlayingId(null);
      }
    } else {
      // 停止之前的播放
      if (audioRef) {
        audioRef.pause();
      }

      // 创建新的音频对象
      const audio = new Audio(musicUrls.audio_url);
      audio.onended = () => setCurrentPlayingId(null);
      audio.onerror = () => {
        showError(t('音频播放失败'));
        setCurrentPlayingId(null);
      };
      
      setAudioRef(audio);
      setCurrentPlayingId(record.task_id);
      audio.play().catch(() => {
        showError(t('音频播放失败'));
        setCurrentPlayingId(null);
      });
    }
  };

  // 图片预览功能
  const showImagePreview = (imageUrl) => {
    setPreviewImageSrc(imageUrl);
    setPreviewImageVisible(true);
  };

  // 视频播放功能
  const showVideoPlayer = (videoUrl) => {
    setCurrentVideoUrl(videoUrl);
    setVideoModalVisible(true);
  };

  // 获取视频URL - 从任务数据中提取视频链接
  const getVideoUrls = (record) => {
    try {
      // 对于视频任务，URL通常在fail_reason字段中（成功时）
      if (record.fail_reason && /^https?:\/\//.test(record.fail_reason)) {
        return {
          video_url: record.fail_reason,
          title: record.action === 'generate' ? '图生视频' : '文生视频'
        };
      }

      // 也检查data字段中是否有视频URL
      if (record.data) {
        const taskData = parseTaskData(record);
        if (taskData) {
          // 可能的视频URL字段
          const videoUrl = taskData.video_url || 
                          taskData.url || 
                          (taskData.data && taskData.data.url) ||
                          (taskData.data && taskData.data.video_url);
          
          if (videoUrl && /^https?:\/\//.test(videoUrl)) {
            return {
              video_url: videoUrl,
              title: record.action === 'generate' ? '图生视频' : '文生视频'
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('解析视频URL失败:', error);
      return null;
    }
  };

  // 渲染缩略图组件
  const renderThumbnail = (imageUrl, title = '') => {
    if (!imageUrl) return null;

    return (
      <div 
        className="inline-block cursor-pointer rounded overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
        onClick={() => showImagePreview(imageUrl)}
        style={{ 
          width: '60px', 
          height: '60px',
          position: 'relative'
        }}
      >
        <img
          src={imageUrl}
          alt={title || t('缩略图')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `
              <div style="
                width: 100%; 
                height: 100%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                background: #f5f5f5; 
                color: #999;
                font-size: 12px;
              ">
                图片加载失败
              </div>
            `;
          }}
        />
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
            color: 'white',
            fontSize: '12px'
          }}
          className="hover:opacity-100 hover:bg-black hover:bg-opacity-30"
        >
          {t('点击预览')}
        </div>
      </div>
    );
  };

  // 列选择器模态框
  const renderColumnSelector = () => {
    return (
      <Modal
        title={t('列设置')}
        visible={showColumnSelector}
        onCancel={() => setShowColumnSelector(false)}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => initDefaultColumns()}>
              {t('重置')}
            </Button>
            <Button onClick={() => setShowColumnSelector(false)}>
              {t('取消')}
            </Button>
            <Button onClick={() => setShowColumnSelector(false)}>
              {t('确定')}
            </Button>
          </div>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <Checkbox
            checked={Object.values(visibleColumns).every((v) => v === true)}
            indeterminate={
              Object.values(visibleColumns).some((v) => v === true) &&
              !Object.values(visibleColumns).every((v) => v === true)
            }
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            {t('全选')}
          </Checkbox>
        </div>
        <div className="flex flex-wrap max-h-96 overflow-y-auto rounded-lg p-4" style={{ border: '1px solid var(--semi-color-border)' }}>
          {allColumns.map((column) => {
            // 为非管理员用户跳过管理员专用列
            if (!isAdminUser && column.key === COLUMN_KEYS.CHANNEL) {
              return null;
            }

            return (
              <div key={column.key} className="w-1/2 mb-4 pr-2">
                <Checkbox
                  checked={!!visibleColumns[column.key]}
                  onChange={(e) =>
                    handleColumnVisibilityChange(column.key, e.target.checked)
                  }
                >
                  {column.title}
                </Checkbox>
              </div>
            );
          })}
        </div>
      </Modal>
    );
  };

  return (
    <>
      {renderColumnSelector()}
      <Layout>
        <Card
          className="!rounded-2xl mb-4"
          title={
            <div className="flex flex-col w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full">
                <div className="flex items-center text-orange-500 mb-2 md:mb-0">
                  <IconEyeOpened className="mr-2" />
                  <Text>{t('任务记录')}</Text>
                </div>
                <Button
                  type='tertiary'
                  className="w-full md:w-auto"
                  onClick={() => setCompactMode(!compactMode)}
                  size="small"
                >
                  {compactMode ? t('自适应列表') : t('紧凑列表')}
                </Button>
              </div>

              <Divider margin="12px" />

              {/* 搜索表单区域 */}
              <Form
                initValues={formInitValues}
                getFormApi={(api) => setFormApi(api)}
                onSubmit={refresh}
                allowEmpty={true}
                autoComplete="off"
                layout="vertical"
                trigger="change"
                stopValidateWithError={false}
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 时间选择器 */}
                    <div className="col-span-1 lg:col-span-2">
                      <Form.DatePicker
                        field='dateRange'
                        className="w-full"
                        type='dateTimeRange'
                        placeholder={[t('开始时间'), t('结束时间')]}
                        showClear
                        pure
                        size="small"
                      />
                    </div>

                    {/* 任务 ID */}
                    <Form.Input
                      field='task_id'
                      prefix={<IconSearch />}
                      placeholder={t('任务 ID')}
                      showClear
                      pure
                      size="small"
                    />

                    {/* 渠道 ID - 仅管理员可见 */}
                    {isAdminUser && (
                      <Form.Input
                        field='channel_id'
                        prefix={<IconSearch />}
                        placeholder={t('渠道 ID')}
                        showClear
                        pure
                        size="small"
                      />
                    )}
                  </div>

                  {/* 操作按钮区域 */}
                  <div className="flex justify-between items-center">
                    <div></div>
                    <div className="flex gap-2">
                      <Button
                        type='tertiary'
                        htmlType='submit'
                        loading={loading}
                        size="small"
                      >
                        {t('查询')}
                      </Button>
                      <Button
                        type='tertiary'
                        onClick={() => {
                          if (formApi) {
                            formApi.reset();
                            // 重置后立即查询，使用setTimeout确保表单重置完成
                            setTimeout(() => {
                              refresh();
                            }, 100);
                          }
                        }}
                        size="small"
                      >
                        {t('重置')}
                      </Button>
                      <Button
                        type='tertiary'
                        onClick={() => setShowColumnSelector(true)}
                        size="small"
                      >
                        {t('列设置')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Form>
            </div>
          }
          shadows='always'
          bordered={false}
        >
          <Table
            columns={compactMode ? getVisibleColumns().map(({ fixed, ...rest }) => rest) : getVisibleColumns()}
            dataSource={logs}
            rowKey='key'
            loading={loading}
            scroll={compactMode ? undefined : { x: 'max-content' }}
            className="rounded-xl overflow-hidden"
            size="middle"
            empty={
              <Empty
                image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
                darkModeImage={<IllustrationNoResultDark style={{ width: 150, height: 150 }} />}
                description={t('搜索无结果')}
                style={{ padding: 30 }}
              />
            }
            pagination={{
              formatPageText: (page) =>
                t('第 {{start}} - {{end}} 条，共 {{total}} 条', {
                  start: page.currentStart,
                  end: page.currentEnd,
                  total: logCount,
                }),
              currentPage: activePage,
              pageSize: pageSize,
              total: logCount,
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              onPageSizeChange: handlePageSizeChange,
              onPageChange: handlePageChange,
            }}
          />
        </Card>

        <Modal
          visible={isModalOpen}
          onOk={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          closable={null}
          bodyStyle={{ height: '400px', overflow: 'auto' }} // 设置模态框内容区域样式
          width={800} // 设置模态框宽度
        >
          <p style={{ whiteSpace: 'pre-line' }}>{modalContent}</p>
        </Modal>

        {/* 图片预览模态框 */}
        <Image
          src={previewImageSrc}
          visible={previewImageVisible}
          onVisibleChange={(visible) => setPreviewImageVisible(visible)}
          preview={{
            zIndex: 1050,
            getContainer: () => document.body
          }}
        />

        {/* 视频播放模态框 */}
        <Modal
          visible={videoModalVisible}
          onCancel={() => {
            setVideoModalVisible(false);
            if (currentVideoRef) {
              currentVideoRef.pause();
            }
          }}
          onOk={() => {
            setVideoModalVisible(false);
            if (currentVideoRef) {
              currentVideoRef.pause();
            }
          }}
          title={t('视频播放')}
          width={800}
          style={{ top: 50 }}
          bodyStyle={{ 
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}
          footer={[
            <Button 
              key="close" 
              onClick={() => {
                setVideoModalVisible(false);
                if (currentVideoRef) {
                  currentVideoRef.pause();
                }
              }}
            >
              {t('关闭')}
            </Button>
          ]}
        >
          {currentVideoUrl && (
            <video
              ref={(ref) => setCurrentVideoRef(ref)}
              src={currentVideoUrl}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                width: '100%',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onError={(e) => {
                console.error('视频播放错误:', e);
                showError(t('视频加载失败'));
              }}
            >
              {t('您的浏览器不支持视频播放')}
            </video>
          )}
        </Modal>
      </Layout>
    </>
  );
};

export default LogsTable;
