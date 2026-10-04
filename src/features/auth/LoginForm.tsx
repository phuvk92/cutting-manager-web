import React, { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import axios from "axios"
import { extractErrorMessage } from "@/utils/error"
import { ErrorResponse } from "@/types/common"
import { message } from "antd"

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null)
    try {
      await login(data)
      message.success("Đăng nhập thành công")
      navigate("/dashboard")
    } catch (err) {
      const code = axios.isAxiosError<ErrorResponse>(err) ? err.response?.data?.code : undefined
      if (code === "USER_ACCOUNT_EXPIRED") {
        setErrorMessage("Tài khoản của bạn đã hết hạn. Vui lòng liên hệ quản trị viên.")
      } else if (code === "USER_WEB_LOGIN_FORBIDDEN") {
        // F-57 (Q1): thợ chỉ dùng phần mềm cắt — trang web dành cho quản trị
        setErrorMessage("Tài khoản thợ chỉ dùng trong phần mềm cắt. Trang này dành cho quản trị đại lý.")
      } else if (code === "AUTH_SERVICE_UNAVAILABLE") {
        setErrorMessage("Máy chủ xác thực đang gặp sự cố. Vui lòng thử lại sau ít phút.")
      } else {
        setErrorMessage(
          extractErrorMessage(
            err,
            "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu."
          )
        )
      }
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    message.info("Vui lòng liên hệ quản trị xưởng hoặc admin để đặt lại mật khẩu.")
  }

  return (
    <div
      className="login-page"
      style={{
        height: "100vh",
        minHeight: "720px",
        display: "flex",
        background: "#17161A",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: "#F4F3F0",
        overflow: "hidden",
      }}
    >
      {/* ══ MẢNG HÌNH ══ */}
      <div
        className="login-hero-container"
        style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          background: "#1E1D22",
          overflow: "hidden",
        }}
      >
        {/* Futuristic Automotive Grid & Silhouette Art */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 40% 40%, rgba(124, 58, 237, 0.18) 0%, transparent 60%),
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 36px 36px, 36px 36px",
            opacity: 0.85,
          }}
        />

        {/* Center Vector Graphics */}
        <div
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 620,
            opacity: 0.35,
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%" }}>
            <path
              d="M100 280 C150 280 200 240 260 210 C320 180 400 170 520 175 C600 178 680 220 740 280"
              stroke="#7C3AED"
              strokeWidth="3"
              strokeDasharray="8 6"
            />
            <path
              d="M180 280 A 45 45 0 1 0 270 280 A 45 45 0 1 0 180 280"
              stroke="#B79CF5"
              strokeWidth="2"
            />
            <path
              d="M570 280 A 45 45 0 1 0 660 280 A 45 45 0 1 0 570 280"
              stroke="#B79CF5"
              strokeWidth="2"
            />
            <path
              d="M260 210 L340 130 L480 130 L550 180"
              stroke="#7C3AED"
              strokeWidth="2.5"
            />
            <line x1="50" y1="325" x2="750" y2="325" stroke="#34333B" strokeWidth="2" />
          </svg>
        </div>

        {/* Dynamic Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(105deg, rgba(124,58,237,0.42) 0%, rgba(124,58,237,0.10) 46%, rgba(23,22,26,0.72) 78%, #17161A 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Hero Bottom Typography */}
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 56,
            maxWidth: 560,
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <div
            style={{
              font: "600 11px 'IBM Plex Sans', sans-serif",
              letterSpacing: "0.14em",
              color: "#B79CF5",
            }}
          >
            PCUT
          </div>
          <div
            style={{
              marginTop: 14,
              font: "600 34px/1.25 'IBM Plex Sans', sans-serif",
              color: "#FFF",
            }}
          >
            Phần mềm cắt phim chuyên dụng cho xưởng dán xe
          </div>
          <div
            style={{
              marginTop: 12,
              font: "400 14px/1.6 'IBM Plex Sans', sans-serif",
              color: "#A9A7B2",
            }}
          >
            Thư viện 1 284 mẫu xe, sửa biên dạng trực tiếp và xuất lệnh cắt trong cùng một luồng.
          </div>
        </div>
      </div>

      {/* ══ THẺ ĐĂNG NHẬP ══ */}
      <div
        className="login-card-container"
        style={{
          width: 460,
          flex: "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 56px",
          background: "#1B1A1F",
          borderLeft: "1px solid #2C2B32",
          zIndex: 3,
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="7" stroke="#7C3AED" strokeWidth="2.4" />
            <path
              d="M9 21.5 16 9l7 12.5"
              stroke="#7C3AED"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.2 17h7.6"
              stroke="#7C3AED"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="2.4 3"
            />
          </svg>
          <span
            style={{
              font: "600 19px 'IBM Plex Sans', sans-serif",
              letterSpacing: "-0.01em",
              color: "#F4F3F0",
            }}
          >
            PCUT
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            marginTop: 34,
            font: "600 22px 'IBM Plex Sans', sans-serif",
            color: "#F4F3F0",
          }}
        >
          Đăng nhập
        </div>
        <div
          style={{
            marginTop: 7,
            font: "400 12.5px 'IBM Plex Sans', sans-serif",
            color: "#8A8894",
          }}
        >
          Dùng tài khoản xưởng được cấp để vào Design Center.
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              marginTop: 18,
              padding: "10px 14px",
              borderRadius: 6,
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#FCA5A5",
              fontSize: "12.5px",
              lineHeight: 1.4,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            marginTop: 26,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Tên đăng nhập */}
          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span
              style={{
                font: "500 11.5px 'IBM Plex Sans', sans-serif",
                color: "#A9A7B2",
              }}
            >
              Tên đăng nhập
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 12px",
                background: "#232228",
                border: errors.username
                  ? "1px solid #EF4444"
                  : focusedField === "username"
                  ? "1px solid #7C3AED"
                  : "1px solid #34333B",
                borderRadius: 6,
                transition: "border-color 0.15s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7C7A85"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="8.5" r="3.5" />
                <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
              </svg>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="ten.tho"
                    autoComplete="username"
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => {
                      field.onBlur()
                      setFocusedField(null)
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "11px 0",
                      border: 0,
                      outline: "none",
                      background: "transparent",
                      font: "400 13.5px 'IBM Plex Sans', sans-serif",
                      color: "#F4F3F0",
                    }}
                  />
                )}
              />
            </span>
            {errors.username && (
              <span style={{ color: "#EF4444", fontSize: "11px", marginTop: 2 }}>
                {errors.username.message}
              </span>
            )}
          </label>

          {/* Mật khẩu */}
          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span
              style={{
                font: "500 11.5px 'IBM Plex Sans', sans-serif",
                color: "#A9A7B2",
              }}
            >
              Mật khẩu
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 12px",
                background: "#232228",
                border: errors.password
                  ? "1px solid #EF4444"
                  : focusedField === "password"
                  ? "1px solid #7C3AED"
                  : "1px solid #34333B",
                borderRadius: 6,
                transition: "border-color 0.15s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7C7A85"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
                <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
              </svg>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => {
                      field.onBlur()
                      setFocusedField(null)
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "11px 0",
                      border: 0,
                      outline: "none",
                      background: "transparent",
                      font: "400 13.5px 'IBM Plex Sans', sans-serif",
                      color: "#F4F3F0",
                    }}
                  />
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  padding: "2px 4px",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  font: "500 11px 'IBM Plex Sans', sans-serif",
                  color: showPassword ? "#B79CF5" : "#8A8894",
                  transition: "color 0.15s",
                  flexShrink: 0,
                }}
                onMouseOver={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = "#B79CF5"
                }}
                onMouseOut={(e) => {
                  if (!showPassword) {
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#8A8894"
                  }
                }}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </span>
            {errors.password && (
              <span style={{ color: "#EF4444", fontSize: "11px", marginTop: 2 }}>
                {errors.password.message}
              </span>
            )}
          </label>

          {/* Ghi nhớ máy này & Quên mật khẩu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 2,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                font: "400 12px 'IBM Plex Sans', sans-serif",
                color: "#A9A7B2",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: "#7C3AED",
                  margin: 0,
                  cursor: "pointer",
                }}
              />
              <span>Ghi nhớ máy này</span>
            </label>
            <a
              href="#"
              onClick={handleForgotPassword}
              style={{
                font: "400 12px 'IBM Plex Sans', sans-serif",
                color: "#B79CF5",
                textDecoration: "none",
              }}
            >
              Quên mật khẩu?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 6,
              padding: "12px",
              border: 0,
              borderRadius: 6,
              background: isLoading ? "#5B21B6" : "#7C3AED",
              cursor: isLoading ? "not-allowed" : "pointer",
              font: "500 13.5px 'IBM Plex Sans', sans-serif",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease",
            }}
            onMouseOver={(e) => {
              if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = "#8B4CF0"
            }}
            onMouseOut={(e) => {
              if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = "#7C3AED"
            }}
          >
            {isLoading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: 30,
            paddingTop: 18,
            borderTop: "1px solid #2C2B32",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              font: "400 11px 'IBM Plex Mono', monospace",
              color: "#6B6975",
            }}
          >
            v1.0.0
          </span>
          <span
            style={{
              font: "400 11.5px 'IBM Plex Sans', sans-serif",
              color: "#6B6975",
            }}
          >
            Chưa có tài khoản? Liên hệ quản trị xưởng.
          </span>
        </div>
      </div>
    </div>
  )
}
