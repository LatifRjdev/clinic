import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Select, Input, Spin, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { usePublicDoctors, usePublicSpecialties } from '../../hooks/usePublic';
import DoctorCard from './components/DoctorCard';

const DoctorsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSpecialty = searchParams.get('specialty') || undefined;
  const searchQuery = searchParams.get('q') || '';

  const { data: doctors, isLoading } = usePublicDoctors(selectedSpecialty);
  const { data: specialties } = usePublicSpecialties();

  const filteredDoctors = useMemo(() => {
    if (!Array.isArray(doctors)) return [];
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase();
    return doctors.filter((doc: any) =>
      `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(q) ||
      `${doc.lastName} ${doc.firstName}`.toLowerCase().includes(q)
    );
  }, [doctors, searchQuery]);

  const specialtyOptions = useMemo(() => {
    const opts = [{ value: '', label: t('public.allSpecialties') }];
    if (Array.isArray(specialties)) {
      specialties.forEach((s: any) => {
        const name = typeof s === 'string' ? s : s.name || s.specialty || '';
        if (name) opts.push({ value: name, label: name });
      });
    }
    return opts;
  }, [specialties, t]);

  return (
    <div>
      {/* Page Header */}
      <section style={{
        padding: '48px 32px 32px',
        background: 'linear-gradient(135deg, var(--primary-50), var(--purple-50))',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--gray-800)',
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>
          {t('public.featuredDoctors')}
        </h1>
        <p style={{
          fontSize: 16,
          color: 'var(--gray-500)',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          {t('public.clinicDescription')}
        </p>
      </section>

      {/* Filter Bar */}
      <section className="public-section" style={{ paddingTop: 32, paddingBottom: 0 }}>
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 32,
        }}>
          <Select
            value={selectedSpecialty || ''}
            onChange={(val) => {
              const params: Record<string, string> = {};
              if (val) params.specialty = val;
              if (searchQuery) params.q = searchQuery;
              setSearchParams(params);
            }}
            options={specialtyOptions}
            style={{ minWidth: 220 }}
            size="large"
            placeholder={t('public.filterBySpecialty')}
          />
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--gray-400)' }} />}
            placeholder={t('public.searchDoctor')}
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              const params: Record<string, string> = {};
              if (selectedSpecialty) params.specialty = selectedSpecialty;
              if (val) params.q = val;
              setSearchParams(params);
            }}
            style={{ maxWidth: 320, flex: 1 }}
            size="large"
            allowClear
          />
        </div>
      </section>

      {/* Doctors Grid */}
      <section className="public-section" style={{ paddingTop: 0 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Empty
            description={t('public.noDoctorsFound')}
            style={{ padding: 80 }}
          />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredDoctors.map((doctor: any) => (
              <Col xs={24} sm={12} md={8} lg={6} key={doctor.id}>
                <DoctorCard doctor={doctor} />
              </Col>
            ))}
          </Row>
        )}
      </section>
    </div>
  );
};

export default DoctorsPage;
