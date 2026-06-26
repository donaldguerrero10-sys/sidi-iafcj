-- SIDI · Datos iniciales IAFCJ
-- Ejecuta esto DESPUÉS del schema.sql

-- Organización
insert into public.organizations (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Iglesia Apostólica de la Fe en Cristo Jesús', 'iafcj');

-- Tipos de nodo (jerarquía configurable)
insert into public.org_unit_types (org_id, name, role_label, child_label, rank, tier) values
  ('00000000-0000-0000-0000-000000000001','IFCJ · Nacional','Obispo Presidente','Distritos eclesiásticos',0,'gobierno'),
  ('00000000-0000-0000-0000-000000000001','Distrito eclesiástico','Obispo Distrital','Presbiterios',1,'gobierno'),
  ('00000000-0000-0000-0000-000000000001','Presbiterio','Presbítero','Iglesias',2,'gobierno'),
  ('00000000-0000-0000-0000-000000000001','Iglesia','Pastor','Regiones celulares',3,'gobierno'),
  ('00000000-0000-0000-0000-000000000001','Región celular','Supervisor de Región','Zonas',4,'supervision'),
  ('00000000-0000-0000-0000-000000000001','Zona celular','Supervisor de Zona','Distritos celulares',5,'supervision'),
  ('00000000-0000-0000-0000-000000000001','Distrito celular','Supervisor de Distrito','Áreas',6,'supervision'),
  ('00000000-0000-0000-0000-000000000001','Área celular','Supervisor de Área','Sectores',7,'supervision'),
  ('00000000-0000-0000-0000-000000000001','Sector celular','Supervisor de Sector','Redes',8,'supervision'),
  ('00000000-0000-0000-0000-000000000001','Red celular','Supervisor de Red','Células',9,'supervision'),
  ('00000000-0000-0000-0000-000000000001','Célula','Líder de Célula',null,10,'liderazgo'),
  ('00000000-0000-0000-0000-000000000001','Padre Espiritual','Padre Espiritual',null,11,'liderazgo');

-- Estructura de ejemplo: 1 Iglesia local con células
-- (En producción, el Obispo Presidente agrega los nodos reales desde el admin)
insert into public.org_units (id, org_id, type_id, parent_id, name) values
  -- IFCJ Nacional (raíz)
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=0),
   null, 'IFCJ — Nacional'),
  -- Distrito Centro
  ('10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=1),
   '10000000-0000-0000-0000-000000000001', 'Distrito Centro'),
  -- Presbiterio Reforma
  ('10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=2),
   '10000000-0000-0000-0000-000000000002', 'Presbiterio Reforma'),
  -- Iglesia Roca Fuerte
  ('10000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=3),
   '10000000-0000-0000-0000-000000000003', 'Iglesia Roca Fuerte'),
  -- Región Norte
  ('10000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=4),
   '10000000-0000-0000-0000-000000000004', 'Región Norte'),
  -- Zona 1
  ('10000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=5),
   '10000000-0000-0000-0000-000000000005', 'Zona 1'),
  -- Distrito A
  ('10000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=6),
   '10000000-0000-0000-0000-000000000006', 'Distrito A'),
  -- Área 1
  ('10000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=7),
   '10000000-0000-0000-0000-000000000007', 'Área 1'),
  -- Sector 1
  ('10000000-0000-0000-0000-000000000009',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=8),
   '10000000-0000-0000-0000-000000000008', 'Sector 1'),
  -- Red 1
  ('10000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=9),
   '10000000-0000-0000-0000-000000000009', 'Red 1'),
  -- Célula Esperanza
  ('10000000-0000-0000-0000-000000000011',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=10),
   '10000000-0000-0000-0000-000000000010', 'Célula Esperanza'),
  -- Célula Fe
  ('10000000-0000-0000-0000-000000000012',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.org_unit_types where org_id='00000000-0000-0000-0000-000000000001' and rank=10),
   '10000000-0000-0000-0000-000000000010', 'Célula Fe');

-- Recursos iniciales
insert into public.resources (org_id, title, type, category, description, min_rank, max_rank) values
  ('00000000-0000-0000-0000-000000000001','Visión y Valores de IFCJ','curso','general','Fundamentos doctrinales de la denominación.',0,11),
  ('00000000-0000-0000-0000-000000000001','Serie: Así Como Jesús','curso','general','Estudio devocional para todo líder.',0,11),
  ('00000000-0000-0000-0000-000000000001','Manual del Pastor','manual','gobierno','Administración integral de la iglesia local.',0,3),
  ('00000000-0000-0000-0000-000000000001','Escuela de Supervisores','escuela','supervision','Multiplicación celular y liderazgo.',0,9),
  ('00000000-0000-0000-0000-000000000001','Manual del Líder de Célula','manual','liderazgo','Guía para dirigir tu célula semana a semana.',9,11),
  ('00000000-0000-0000-0000-000000000001','Taller: Multiplicación de Células','taller','supervision','Cómo preparar una célula para multiplicarse.',7,11),
  ('00000000-0000-0000-0000-000000000001','La Iglesia Que Sí Multiplica','libro','biblioteca','Principios bíblicos del modelo celular.',0,11),
  ('00000000-0000-0000-0000-000000000001','Discipulado Intencional','libro','biblioteca','Cómo formar padres e hijos espirituales.',0,11);

-- NOTA: Para crear el primer usuario (Obispo Presidente), ve a
-- Supabase Dashboard > Authentication > Users > Invite user
-- Luego inserta su perfil manualmente:
--
-- insert into public.user_profiles (id, org_id, org_unit_id, full_name, rank) values
--   ('<UUID_DEL_USUARIO>', '00000000-0000-0000-0000-000000000001',
--    '10000000-0000-0000-0000-000000000001', 'Nombre del Obispo', 0);
