import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tag, Rate, Button } from 'antd';

interface DoctorCardProps {
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
    qualification?: string;
    photoUrl?: string;
  };
  rating?: {
    avgRating: number;
    totalReviews: number;
  };
}

const AVATAR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

const getColorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, rating }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fullName = `${doctor.lastName} ${doctor.firstName}`;
  const initials = `${doctor.lastName?.[0] || ''}${doctor.firstName?.[0] || ''}`.toUpperCase();
  const avatarColor = getColorFromName(fullName);

  const handleCardClick = () => {
    navigate(`/doctors/${doctor.id}`);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/book/${doctor.id}`);
  };

  return (
    <div className="doctor-card" onClick={handleCardClick}>
      <div className="doctor-card-photo">
        {doctor.photoUrl ? (
          <img src={doctor.photoUrl} alt={fullName} />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {initials}
          </div>
        )}
      </div>

      <div className="doctor-card-body">
        <div className="doctor-card-name">Dr. {fullName}</div>

        <div style={{ marginBottom: 8 }}>
          <Tag color="blue">{doctor.specialty}</Tag>
        </div>

        {doctor.qualification && (
          <div className="doctor-card-qualification">{doctor.qualification}</div>
        )}

        {rating && rating.totalReviews > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Rate
              disabled
              allowHalf
              value={rating.avgRating}
              style={{ fontSize: 14 }}
            />
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              ({rating.totalReviews})
            </span>
          </div>
        )}

        <Button type="primary" block onClick={handleBookClick}>
          {t('public.bookAppointment')}
        </Button>
      </div>
    </div>
  );
};

export default DoctorCard;
