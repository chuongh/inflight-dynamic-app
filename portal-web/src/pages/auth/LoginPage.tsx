import { Button, Form, Input, message } from 'antd'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Fingerprint,
  Lock,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/useAuth'
import { ROLES } from '@/core/permissions'
import { loadDemoUsers, type DemoUserRecord } from '@/mock-data/loaders/loadAuth'
import { VietJetLogo } from '@/components/brand/VietJetLogo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Text } from '@/components/primitives/Text'
import { paths } from '@/routes/paths'

const heroModules = [
  { icon: Users, textKey: 'auth.moduleHr' as const },
  { icon: UtensilsCrossed, textKey: 'auth.moduleCatering' as const },
  { icon: BarChart3, textKey: 'auth.moduleSales' as const },
  { icon: Boxes, textKey: 'auth.moduleEquipment' as const },
]

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const demoUsers = loadDemoUsers()
  const primaryDemo = demoUsers[0]

  const fillDemo = (user: DemoUserRecord) => {
    form.setFieldsValue({
      staffId: user.employeeCode,
      password: user.password,
    })
  }

  const handleSubmit = async (values: { staffId: string; password: string }) => {
    setLoading(true)
    const ok = await login(values.staffId, values.password)
    setLoading(false)
    if (ok) {
      navigate(paths.dashboard)
      return
    }
    message.error(t('auth.invalidCredentials'))
  }

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <div className="login-page__hero-bg" aria-hidden />
        <div className="login-page__hero-grid" aria-hidden />
        <div className="login-page__hero-stripe" aria-hidden />

        <div className="login-page__hero-content login-page__enter login-page__enter--1">
          <VietJetLogo size="lg" variant="white" />
          <p className="login-page__product-name">{t('auth.appName')}</p>
        </div>

        <div className="login-page__hero-content login-page__enter login-page__enter--2">
          <h1 className="login-page__hero-title font-vja-heading">{t('auth.heroTitle')}</h1>
          <p className="login-page__hero-desc">{t('auth.heroDesc')}</p>
          <ul className="login-page__hero-features">
            {heroModules.map(({ icon: Icon, textKey }, index) => (
              <li
                key={textKey}
                className={`login-page__hero-feature login-page__enter login-page__enter--mod-${index + 1}`}
              >
                <span className="login-page__hero-feature-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                {t(textKey)}
              </li>
            ))}
          </ul>
        </div>

        <div className="login-page__hero-content login-page__enter login-page__enter--3 login-page__hero-footer">
          {t('auth.footer')}
        </div>
      </div>

      <div className="login-page__form-panel">
        {/* Mobile / tablet brand header — desktop uses the full-bleed hero instead */}
        <div className="login-page__mobile-brand login-page__enter login-page__enter--1">
          <div className="login-page__mobile-brand-inner">
            <VietJetLogo size="md" variant="white" />
            <p className="login-page__mobile-brand-name">{t('auth.appName')}</p>
          </div>
        </div>

        <div className="login-page__card login-page__enter login-page__enter--form">
          <div className="login-page__card-header">
            <div className="login-page__card-brand">
              <VietJetLogo size="md" />
              <Text variant="bodySm" tone="secondary" className="font-vja-subhead">
                {t('auth.appName')}
              </Text>
            </div>
            <LanguageSwitcher />
          </div>

          <h2 className="login-page__title font-vja-heading">{t('auth.welcomeBack')}</h2>
          <p className="login-page__subtitle">{t('auth.signInSubtitle')}</p>

          <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
            <Form.Item
              name="staffId"
              label={<span className="login-page__label">{t('auth.staffId')}</span>}
              rules={[{ required: true, message: t('auth.staffIdRequired') }]}
            >
              <Input
                size="large"
                autoComplete="username"
                placeholder={t('auth.staffIdPlaceholder')}
                prefix={<Fingerprint className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="login-page__label">{t('auth.password')}</span>}
              rules={[{ required: true, message: t('auth.passwordRequired') }]}
            >
              <Input.Password
                size="large"
                autoComplete="current-password"
                placeholder="••••••••"
                prefix={<Lock className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="login-page__submit"
            >
              <span className="flex items-center justify-center gap-2">
                {t('common.signIn')} <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Button>
          </Form>

          <div className="login-page__demo">
            <div className="login-page__demo-head">
              <p className="login-page__demo-label">{t('auth.demoRoles')}</p>
              <p className="login-page__demo-hint">
                {t('auth.demoHint', { password: primaryDemo.password })}
              </p>
            </div>
            <div className="login-page__demo-grid" role="list">
              {demoUsers.map((user) => {
                const role = ROLES[user.roleId]
                const label = i18n.language.startsWith('vi') ? role.labelVi : role.label
                return (
                  <button
                    key={user.employeeCode}
                    type="button"
                    role="listitem"
                    className="login-page__demo-role"
                    onClick={() => fillDemo(user)}
                    title={`${label} · ${t('auth.staffId')} ${user.employeeCode}`}
                  >
                    <span className="login-page__demo-role-name">{label}</span>
                    <span className="login-page__demo-role-id">
                      <Fingerprint className="login-page__demo-role-id-icon" aria-hidden />
                      <span className="login-page__demo-role-id-label">{t('auth.staffId')}</span>
                      <span className="login-page__demo-role-code tnum">{user.employeeCode}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="login-page__mobile-footer">{t('auth.footer')}</p>
        </div>
      </div>
    </div>
  )
}
