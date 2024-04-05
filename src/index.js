import k8s, { Watch } from '@kubernetes/client-node'
import zmq from 'zeromq'
import logger from './logger.js'

const log = logger(import.meta)
const { REQUEST_PORT = 7001, PUBLISH_PORT = 7002, LABEL } = process.env
const zmq_publisher = new zmq.Publisher()
const zmq_reply = new zmq.Reply()

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

log.info({ REQUEST_PORT, PUBLISH_PORT }, 'binding sockets..')

await zmq_reply.bind(`tcp://0.0.0.0:${REQUEST_PORT}`)
await zmq_publisher.bind(`tcp://127.0.0.1:${PUBLISH_PORT}`)

const respond_with_endpoints = async () => {
  const {
    body: { items },
  } = await k8sApi.listNamespacedPod('stable')
  const ips = items
    .filter(({ metadata: { labels } }) => labels.app === LABEL)
    .map(({ status: { podIP } }) => podIP)
    .filter(Boolean)

  log.info({ ips }, 'sending pods')
  await zmq_reply.send(ips)
}

await new Watch(kc).watch(
  '/api/v1/pods',
  {
    labelSelector: `app=${LABEL}`,
  },
  (type, { status: { podIP } }) => {
    if (!podIP) return
    log.info({ type, ip: podIP }, 'sending update')
    zmq_publisher.send([type, podIP]).catch(error => log.error(error))
  },
  error => {
    console.error('Watcher stopped with error:', error)
  }
)

while (await zmq_reply.receive()) await respond_with_endpoints()
