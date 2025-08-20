import React, { useState, useEffect } from 'react';
import { useTokenKeys } from '../../hooks/useTokenKeys';
import { Spin, Modal, Form, Select, Input, Button, Typography, Space, Tag, Divider } from '@douyinfe/semi-ui';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTokens } from '../../helpers/token';

const { Text, Paragraph } = Typography;

const ChatPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { keys, serverAddress, isLoading } = useTokenKeys(id);
  
  // 弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [keyType, setKeyType] = useState('existing'); // 'existing' 或 'custom'
  const [availableTokens, setAvailableTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [finalUrl, setFinalUrl] = useState('');

  // 获取令牌列表
  const loadTokens = async () => {
    setTokensLoading(true);
    try {
      const tokens = await fetchTokens();
      setAvailableTokens(tokens);
      if (tokens.length > 0 && !selectedKey) {
        setSelectedKey(tokens[0].key);
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
    setTokensLoading(false);
  };

  // 构建聊天链接
  const comLink = (key) => {
    if (!serverAddress || !key) return '';
    let link = '';
    if (id) {
      let chats = localStorage.getItem('chats');
      if (chats) {
        chats = JSON.parse(chats);
        if (Array.isArray(chats) && chats.length > 0) {
          for (let k in chats[id]) {
            link = chats[id][k];
            link = link.replaceAll(
              '{address}',
              encodeURIComponent(serverAddress),
            );
            link = link.replaceAll('{key}', 'sk-' + key);
          }
        }
      }
    }
    return link;
  };

  // 更新预览URL
  const updatePreviewUrl = () => {
    const key = keyType === 'existing' ? selectedKey : customKey;
    if (key) {
      const url = comLink(key);
      setFinalUrl(url);
    } else {
      setFinalUrl('');
    }
  };

  // 监听变化更新预览URL
  useEffect(() => {
    updatePreviewUrl();
  }, [selectedKey, customKey, keyType, serverAddress, id]);

  // 初始化显示弹窗和恢复保存的设置
  useEffect(() => {
    if (!isLoading && keys.length > 0) {
      const savedKey = localStorage.getItem(`chat-selected-key-${id}`);
      const savedKeyType = localStorage.getItem(`chat-key-type-${id}`);
      
      // 如果有保存的设置，恢复它们
      if (savedKey && savedKeyType) {
        setKeyType(savedKeyType);
        if (savedKeyType === 'existing') {
          setSelectedKey(savedKey);
        } else {
          setCustomKey(savedKey);
        }
      }
      
      setShowModal(true);
      loadTokens();
    }
  }, [isLoading, keys, id]);

  // 确认选择
  const handleConfirm = () => {
    const key = keyType === 'existing' ? selectedKey : customKey;
    if (key && finalUrl) {
      setShowModal(false);
      // 保存选择到localStorage以便下次使用
      localStorage.setItem(`chat-selected-key-${id}`, key);
      localStorage.setItem(`chat-key-type-${id}`, keyType);
    }
  };

  // 获取当前使用的key
  const getCurrentKey = () => {
    const savedKey = localStorage.getItem(`chat-selected-key-${id}`);
    const savedKeyType = localStorage.getItem(`chat-key-type-${id}`);
    
    if (savedKey && savedKeyType) {
      return savedKey;
    }
    
    return keyType === 'existing' ? selectedKey : customKey;
  };

  const iframeSrc = !showModal && finalUrl ? finalUrl : '';

  return (
    <>
      {/* 令牌选择弹窗 */}
      <Modal
        title={t('一键配置')}
        visible={showModal}
        onCancel={() => setShowModal(false)}
        width={600}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowModal(false)}>
              {t('取消')}
            </Button>
            <Button 
              type="primary" 
              onClick={handleConfirm}
              disabled={!(keyType === 'existing' ? selectedKey : customKey)}
            >
              {t('确定')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* BaseUrl 显示 */}
          <div>
            <Text strong>{t('BaseUrl')}</Text>
            <Input
              value={serverAddress}
              readOnly
              className="mt-2"
              placeholder="https://api.ephone.chat"
            />
          </div>

          {/* APIKey 类型选择 */}
          <div>
            <Text strong>{t('APIKey')}</Text>
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="existing"
                  name="keyType"
                  value="existing"
                  checked={keyType === 'existing'}
                  onChange={(e) => setKeyType(e.target.value)}
                />
                <label htmlFor="existing">{t('在iframe中加载')}</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="custom"
                  name="keyType"
                  value="custom"
                  checked={keyType === 'custom'}
                  onChange={(e) => setKeyType(e.target.value)}
                />
                <label htmlFor="custom">{t('自定义输入')}</label>
              </div>
            </div>
          </div>

          {/* 令牌选择或自定义输入 */}
          <div>
            <Text strong>{t('API Key')}</Text>
            {keyType === 'existing' ? (
              <Select
                value={selectedKey}
                onChange={setSelectedKey}
                className="w-full mt-2"
                placeholder={t('选择已创建的令牌')}
                loading={tokensLoading}
                filter
              >
                {availableTokens.map((token) => (
                  <Select.Option key={token.key} value={token.key}>
                    <div className="flex justify-between items-center">
                      <span>{token.name}</span>
                      <div className="flex gap-1">
                        {token.unlimited_quota ? (
                          <Tag color="green" size="small">无限</Tag>
                        ) : (
                          <Tag color="blue" size="small">
                            余额: {(token.remain_quota / 500000).toFixed(2)}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Input
                value={customKey}
                onChange={setCustomKey}
                className="mt-2"
                placeholder={t('自定义输入 API Key')}
              />
            )}
          </div>

          {/* URL 预览 */}
          {finalUrl && (
            <>
              <Divider />
              <div>
                <Text strong>{t('预览 URL')}</Text>
                <Paragraph 
                  copyable
                  className="mt-2 p-3 bg-gray-50 rounded border"
                  style={{ wordBreak: 'break-all', fontSize: '12px' }}
                >
                  {finalUrl}
                </Paragraph>
              </div>
            </>
          )}

          {/* 提示信息 */}
          <div className="text-sm text-gray-500">
            <Text type="secondary">
              {t('注意：如果没有可用的 API Key，请前往')}
              <a href="/console/token" target="_blank" className="text-blue-500 hover:underline">
                {t('令牌管理')}
              </a>
              {t('页面创建。')}
            </Text>
          </div>
        </div>
      </Modal>

      {/* 主内容区域 */}
      {!isLoading && iframeSrc ? (
        <iframe
          src={iframeSrc}
          style={{ width: '100%', height: 'calc(100vh - 64px)', border: 'none', marginTop: '64px' }}
          title='Token Frame'
          allow='camera;microphone'
        />
      ) : (
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-white/80 z-[1000] mt-[64px]">
          <div className="flex flex-col items-center">
            <Spin
              size="large"
              spinning={true}
              tip={null}
            />
            <span className="whitespace-nowrap mt-2 text-center" style={{ color: 'var(--semi-color-primary)' }}>
              {showModal ? t('请选择令牌配置...') : t('正在跳转...')}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPage;
