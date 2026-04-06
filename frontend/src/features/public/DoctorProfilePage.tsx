import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Tag, Button, Rate, Spin, Input, message, Divider, Empty } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  StarFilled,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  LoginOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usePublicDoctorProfile,
  usePublicDoctorReviews,
  usePublicDoctorRating,
  usePublicSlots,
} from '../../hooks/usePublic';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/format';

const DAY_NAMES: Record<string, string[]> = {
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  tj: ['Яш', 'Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шн'],
};

const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { user, isAuthenticated } = useAuthStore();

  const { data: doctor, isLoading: loadingDoctor } = usePublicDoctorProfile(id!);
  const { data: reviews, isLoading: loadingReviews } = usePublicDoctorReviews(id!);
  const { data: ratingData } = usePublicDoctorRating(id!);

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todaySlots } = usePublicSlots(id, todayStr);

  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // Find next available slot
  const nextAvailableSlot = (() => {
    if (!Array.isArray(todaySlots)) return null;
    const available = todaySlots.find((s: any) => s.available);
    return available || null;
  })();

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      message.success(t('public.linkCopied', 'Ссылка скопирована'));
    });
  };

  const createReviewMutation = useMutation({
    mutationFn: (data: { doctorId: string; rating: number; comment: string }) =>
      apiClient.post('/reviews', data).then((r) => r.data),
    onSuccess: () => {
      message.success(t('public.reviewSubmitted'));
      setReviewText('');
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ['public-doctor-reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['public-doctor-rating', id] });
    },
    onError: () => {
      message.error(t('public.reviewSubmitError'));
    },
  });

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      message.warning(t('public.reviewTextRequired'));
      return;
    }
    createReviewMutation.mutate({
      doctorId: id!,
      rating: reviewRating,
      comment: reviewText.trim(),
    });
  };

  const days = DAY_NAMES[i18n.language] || DAY_NAMES.ru;

  if (loadingDoctor) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="public-section">
        <Empty description={t('public.doctorNotFound')} />
      </div>
    );
  }

  const fullName = `${doctor.lastName ?? ''} ${doctor.firstName ?? ''} ${doctor.middleName ?? ''}`.trim();
  const initials = `${(doctor.lastName ?? '')[0] ?? ''}${(doctor.firstName ?? '')[0] ?? ''}`.toUpperCase();
  const avgRating = ratingData?.average ?? 0;
  const totalReviews = ratingData?.count ?? reviews?.length ?? 0;

  const scheduleItems: { dayOfWeek: number; startTime: string; endTime: string; breakStart?: string; breakEnd?: string }[] =
    doctor.schedules ?? doctor.schedule ?? [];

  const services: { id: string; name: string; price: number; duration: number }[] =
    doctor.services ?? [];

  return (
    <div className="public-section">
      <Row gutter={[32, 32]}>
        {/* Left column */}
        <Col xs={24} md={8}>
          <div className="modern-card">
            <div className="modern-card-body" style={{ textAlign: 'center' }}>
              {/* Photo */}
              {doctor.photoUrl ? (
                <div
                  style={{
                    width: '100%',
                    height: 300,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    marginBottom: 20,
                  }}
                >
                  <img
                    src={doctor.photoUrl}
                    alt={fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 300,
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    color: 'white',
                    fontSize: 64,
                    fontWeight: 800,
                    letterSpacing: 2,
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Name */}
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
                {fullName}
              </h2>

              {/* Specialty */}
              {doctor.specialty && (
                <Tag color="blue" style={{ marginBottom: 12 }}>
                  {doctor.specialty}
                </Tag>
              )}

              {/* Qualification */}
              {doctor.qualification && (
                <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <MedicineBoxOutlined />
                  {doctor.qualification}
                </div>
              )}

              {/* License */}
              {doctor.licenseNumber && (
                <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <SafetyCertificateOutlined />
                  {t('public.license', 'Лицензия')}: {doctor.licenseNumber}
                </div>
              )}

              {/* Rating */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Rate disabled allowHalf value={avgRating} style={{ fontSize: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
                  {avgRating.toFixed(1)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  ({totalReviews} {t('public.reviews', 'отзывов')})
                </span>
              </div>

              {/* Book button */}
              <Button
                type="primary"
                size="large"
                block
                icon={<CalendarOutlined />}
                onClick={() => navigate(`/book/${id}`)}
              >
                {t('public.bookDoctor', 'Записаться к этому врачу')}
              </Button>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
                {t('public.noRegistrationRequired', 'Регистрация не требуется')}
              </div>

              {/* Next available slot */}
              {nextAvailableSlot && (
                <div style={{
                  marginTop: 12, padding: '8px 12px', borderRadius: 8,
                  background: 'var(--primary-50)', fontSize: 13, color: 'var(--primary-700)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <ClockCircleOutlined />
                  {t('public.nextAppointment', 'Ближайший приём')}:{' '}
                  <strong>{(nextAvailableSlot as any).startTime?.slice(0, 5)}</strong>
                </div>
              )}

              {/* Patient cabinet link */}
              <Button
                block
                icon={<LoginOutlined />}
                style={{ marginTop: 12 }}
                onClick={() => navigate('/patient-login')}
              >
                {t('public.patientCabinet', 'Войти в кабинет')}
              </Button>

              {/* Share button */}
              <Button
                block
                icon={<ShareAltOutlined />}
                style={{ marginTop: 8 }}
                onClick={handleShareProfile}
              >
                {t('public.share', 'Поделиться')}
              </Button>
            </div>
          </div>
        </Col>

        {/* Right column */}
        <Col xs={24} md={16}>
          {/* Schedule section */}
          <div className="modern-card" style={{ marginBottom: 24 }}>
            <div className="modern-card-header">
              <h3>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {t('public.schedule', 'Расписание')}
              </h3>
            </div>
            <div className="modern-card-body">
              {scheduleItems.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
                    const slot = scheduleItems.find((s) => s.dayOfWeek === dayIndex);
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: slot ? 'var(--primary-50)' : 'var(--gray-50)',
                          flexWrap: 'wrap',
                          gap: 4,
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-700)', minWidth: 30 }}>
                          {days[dayIndex]}
                        </span>
                        {slot ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span style={{ fontSize: 14, color: 'var(--gray-800)' }}>
                              <ClockCircleOutlined style={{ marginRight: 4, color: 'var(--primary-500)' }} />
                              {slot.startTime} — {slot.endTime}
                            </span>
                            {slot.breakStart && slot.breakEnd && (
                              <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                                ({t('public.break', 'перерыв')}: {slot.breakStart} — {slot.breakEnd})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 14, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                            {t('public.dayOff', 'Выходной')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty description={t('public.noSchedule', 'Расписание не указано')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>

          {/* Services section */}
          {services.length > 0 && (
            <div className="modern-card" style={{ marginBottom: 24 }}>
              <div className="modern-card-header">
                <h3>
                  <MedicineBoxOutlined style={{ marginRight: 8 }} />
                  {t('public.services', 'Услуги')}
                </h3>
              </div>
              <div className="modern-card-body">
                <div style={{ display: 'grid', gap: 8 }}>
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => navigate(`/book/${id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--gray-100)',
                        cursor: 'pointer',
                        transition: 'all 150ms',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary-300)';
                        (e.currentTarget as HTMLDivElement).style.background = 'var(--primary-50)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gray-100)';
                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>
                          {service.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {service.duration} {t('public.minutes', 'минут')}
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-600)' }}>
                        <DollarOutlined style={{ marginRight: 4 }} />
                        {formatCurrency(service.price, { decimals: 0 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews section */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3>
                <StarFilled style={{ marginRight: 8, color: 'var(--warm-500)' }} />
                {t('public.patientReviews', 'Отзывы пациентов')}
              </h3>
            </div>
            <div className="modern-card-body">
              {/* Average rating summary */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  background: 'var(--warm-50)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--gray-900)' }}>
                  {avgRating.toFixed(1)}
                </div>
                <div>
                  <Rate disabled allowHalf value={avgRating} style={{ fontSize: 16 }} />
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                    {totalReviews} {t('public.reviews', 'отзывов')}
                  </div>
                </div>
              </div>

              {/* Reviews list */}
              {loadingReviews ? (
                <Spin />
              ) : reviews && reviews.length > 0 ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  {reviews.map((review: any, idx: number) => (
                    <div
                      key={review.id ?? idx}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--gray-100)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>
                            {review.patientName || t('public.patient', 'Пациент')}
                          </span>
                          <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString(i18n.language === 'tj' ? 'tg-TJ' : 'ru-RU')
                            : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--gray-600)', margin: 0, lineHeight: 1.6 }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description={t('public.noReviews', 'Пока нет отзывов')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}

              {/* Write review form (for logged-in patients) */}
              {isAuthenticated && user?.role === 'patient' && (
                <>
                  <Divider />
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 12 }}>
                      {t('public.writeReview', 'Оставить отзыв')}
                    </h4>
                    <div style={{ marginBottom: 12 }}>
                      <Rate value={reviewRating} onChange={setReviewRating} style={{ fontSize: 24 }} />
                    </div>
                    <Input.TextArea
                      rows={4}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={t('public.reviewPlaceholder', 'Напишите ваш отзыв...')}
                      style={{ marginBottom: 12 }}
                    />
                    <Button
                      type="primary"
                      onClick={handleSubmitReview}
                      loading={createReviewMutation.isPending}
                    >
                      {t('public.submitReview', 'Отправить отзыв')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorProfilePage;
