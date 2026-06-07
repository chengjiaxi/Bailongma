// Genesis Kernel - Protocol
// ��ϢЭ����֤�����л�

import { MessageType, Priority, KERNEL_ID, WILDCARD_ID } from '../shared/types.js'

const VALID_TYPES = new Set(Object.values(MessageType))
const VALID_PRIORITIES = new Set(Object.values(Priority))

/**
 * ��֤��Ϣ�Ƿ����Э��
 * @param {import('../shared/types.js').Message} msg
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMessage(msg) {
  const errors = []

  if (!msg || typeof msg !== 'object') {
    return { valid: false, errors: ['Message must be an object'] }
  }
  if (!msg.id || typeof msg.id !== 'string') {
    errors.push('Missing or invalid id')
  }
  if (!VALID_TYPES.has(msg.type)) {
    errors.push(`Invalid type: ${msg.type}`)
  }
  if (!msg.from || typeof msg.from !== 'string') {
    errors.push('Missing or invalid from')
  }
  if (!msg.to || typeof msg.to !== 'string') {
    errors.push('Missing or invalid to')
  }
  if (typeof msg.ts !== 'number' || msg.ts <= 0) {
    errors.push('Missing or invalid timestamp')
  }
  if (msg.priority != null && !VALID_PRIORITIES.has(msg.priority)) {
    errors.push(`Invalid priority: ${msg.priority}`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * �����Ϣ�Ƿ����
 */
export function isExpired(msg) {
  if (!msg.ttl || msg.ttl <= 0) return false
  return Date.now() - msg.ts > msg.ttl
}

/**
 * �����Ϣ�Ƿ��ǻظ�
 */
export function isReply(msg) {
  return msg.type === MessageType.RESPONSE && msg.replyTo != null
}

/**
 * ��ϢЭ��汾��ʶ��δ�����ڼ�����������
 */
export const PROTOCOL_VERSION = 'genesis-v1'

/**
 * ���л���ϢΪ�ɴ����ʽ
 */
export function serialize(msg) {
  return JSON.stringify({ ...msg, _proto: PROTOCOL_VERSION })
}

/**
 * �����л�����֤
 */
export function deserialize(raw) {
  try {
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
    const { valid, errors } = validateMessage(msg)
    if (!valid) {
      throw new Error(`Protocol violation: ${errors.join(", ")}`)
    }
    delete msg._proto
    return msg
  } catch (err) {
    throw new Error(`Failed to deserialize message: ${err.message}`)
  }
}

/**
 * ���� Agent ���׼����ģ��
 */
export function createAgentRequest(from, to, action, params = {}) {
  return {
    action,
    params,
    requestId: `${from}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
}
