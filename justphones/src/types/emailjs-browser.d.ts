declare module '@emailjs/browser' {
  const emailjs: {
    init: (publicKey: string) => void
    send: (
      serviceId: string,
      templateId: string,
      templateParams?: Record<string, any>,
      optionsOrPublicKey?: string | { publicKey: string }
    ) => Promise<any>
  }
  export default emailjs
}
