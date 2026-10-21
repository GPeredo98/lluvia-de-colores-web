-- Datos iniciales opcionales (programas de ejemplo). Ejecutar después de la migración.
insert into public.programs
  (name, slug, summary, description, age_min_months, age_max_months, modality, price, price_period,
   sessions_per_week, session_minutes, color, icon, features, is_featured, sort_order)
values
  ('Estimulación temprana', 'estimulacion-temprana', 'Juego sensorial y motor para los primeros meses de vida.',
   'Sesiones a domicilio enfocadas en el desarrollo motor, sensorial, cognitivo y del vínculo afectivo.',
   3, 12, 'domicilio', 650, 'mensual', 2, 45, 'sky', 'baby',
   array['Evaluación inicial del desarrollo', 'Plan de actividades para casa', 'Informe mensual'], false, 1),
  ('Pequeños exploradores', 'pequenos-exploradores', 'Lenguaje, movimiento y autonomía de 1 a 3 años.',
   'Estimulación integral: lenguaje, motricidad gruesa y fina, juego simbólico y hábitos de autonomía.',
   12, 36, 'domicilio', 780, 'mensual', 3, 50, 'yellow', 'puzzle',
   array['3 visitas por semana', 'Material didáctico incluido', 'Informe mensual'], true, 2),
  ('Preparación preescolar', 'preparacion-preescolar', 'Prelectura, preescritura y habilidades sociales.',
   'Atención, motricidad fina, conciencia fonológica, nociones lógico-matemáticas y emociones.',
   36, 72, 'mixto', 720, 'mensual', 2, 60, 'pink', 'palette',
   array['Domicilio o centro', 'Cuadernillo de trabajo', 'Reunión trimestral con la familia'], false, 3),
  ('Apoyo escolar', 'apoyo-escolar', 'Tareas, hábitos de estudio y refuerzo de materias.',
   'Acompañamiento de tareas y refuerzo de lectura, escritura y matemáticas.',
   72, 144, 'domicilio', 850, 'mensual', 3, 90, 'green', 'book',
   array['Refuerzo de materias', 'Preparación de exámenes', 'Reporte semanal'], false, 4)
on conflict (slug) do nothing;

-- Para convertir tu cuenta en administrador (después de registrarte en Auth):
-- update public.profiles set role = 'admin' where email = 'tu-correo@dominio.com';
