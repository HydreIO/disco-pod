import debug from 'debug'
import Kubernetes from 'kubernetes-client'
import zmq from 'zeromq'

const log = debug('disco-pod')

const { REQUEST_PORT = 5454, SUBSCRIBE_PORT = 4545, NAMESPACE = 'default', ENDPOINT_NAME = 'disco-pod' } = process.env
const zmq_publisher = new zmq.Publisher()
const zmq_reply = new zmq.Reply()

const k8s = new Kubernetes.Client1_13({ version: '1.13' })

const fetch_endpoints = async () => k8s.api.v1.namespaces(NAMESPACE).endpoints(ENDPOINT_NAME).get()
const subscribe_to_stream = async () => k8s.api.v1.watch.namespaces(NAMESPACE).endpoints(ENDPOINT_NAME).getObjectStream()

zmq_reply.bind(`tcp://0.0.0.0:${REQUEST_PORT}`)
zmq_publisher.bind(`tcp://0.0.0.0:${SUBSCRIBE_PORT}`)

const respond_with_endpoints = async () => {
  log('fetching endpoints..')
  const endpoints = await fetch_endpoints()
  log('found %O', endpoints)
  await zmq_reply.send(endpoints)
}

const publish_update = async update => {
  log('sending update %O', update)
  await zmq_publisher.send(update)
}

const run = async () => {
  const stream = await subscribe_to_stream()
  stream.on('data', publish_update)
  for (; ;) {
    await zmq_reply.receive()
    await respond_with_endpoints()
  }
}

run()
