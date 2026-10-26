-- Keep the Shuttle route stable and describe the full transport service.
BEGIN;
UPDATE public.destinations SET name='Shuttle', short_description='Airport transfers, trips to Hoi An and Da Nang, and personalised journeys arranged by the resort team. Contact the concierge to plan your transport and confirm availability, reservations and rates. The complimentary Hoi An sightseeing shuttle has its own schedule and conditions.' WHERE id='shuttle';

INSERT INTO public.destination_translations(destination_id,locale,description,source_description,published)
SELECT 'shuttle',t.locale,t.description,d.short_description,true
FROM public.destinations d CROSS JOIN (VALUES
('vi','Dịch vụ đưa đón sân bay, các chuyến đi Hội An và Đà Nẵng cùng hành trình riêng do đội ngũ resort sắp xếp. Liên hệ lễ tân hỗ trợ để lên kế hoạch và xác nhận tình trạng dịch vụ, đặt chỗ và giá. Xe tham quan Hội An miễn phí có lịch trình và điều kiện riêng.'),
('ru','Трансферы из аэропорта и обратно, поездки в Хойан и Дананг и индивидуальные маршруты, организованные командой курорта. Обратитесь к консьержу для планирования поездки и уточнения доступности, бронирования и стоимости. Бесплатный экскурсионный шаттл в Хойан действует по отдельному расписанию и условиям.'),
('zh','度假村团队可安排机场接送、会安及岘港出行，以及个性化行程。请联系礼宾团队规划交通，并确认服务供应、预约及费用。免费会安观光接驳车有独立的时刻表和使用条件。'),
('ko','리조트 팀이 공항 이동, 호이안과 다낭 방문, 맞춤 이동 일정을 준비해 드립니다. 컨시어지에 문의하여 교통편을 계획하고 이용 가능 여부, 예약 및 요금을 확인해 주세요. 호이안 무료 관광 셔틀에는 별도의 시간표와 이용 조건이 적용됩니다.'),
('ja','空港送迎、ホイアンやダナンへのお出かけ、お客様に合わせた移動をリゾートのチームが手配します。コンシェルジュにご相談のうえ、空き状況、予約方法、料金をご確認ください。ホイアン無料観光シャトルには別途時刻表と利用条件があります。')
) AS t(locale,description) WHERE d.id='shuttle'
ON CONFLICT(destination_id,locale) DO UPDATE SET description=EXCLUDED.description,source_description=EXCLUDED.source_description,published=true;

UPDATE public.destination_links SET label='Hoi An shuttle schedule' WHERE destination_id='shuttle' AND kind='MENU' AND url='https://www.danang.intercontinental.com/wp-content/uploads/2025/12/Shuttle-Bus-Schedule-to-Hoi-An.pdf';
INSERT INTO public.destination_links(destination_id,kind,url,display_order,active)
SELECT 'shuttle','DISCOVER','https://www.danang.intercontinental.com/amenities/transportation/',0,true
WHERE NOT EXISTS(SELECT 1 FROM public.destination_links WHERE destination_id='shuttle' AND kind='DISCOVER' AND url='https://www.danang.intercontinental.com/amenities/transportation/');
UPDATE public.destination_links SET active=true WHERE destination_id='shuttle' AND kind='DISCOVER' AND url='https://www.danang.intercontinental.com/amenities/transportation/';
COMMIT;
