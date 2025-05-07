--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: field_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.field_type AS ENUM (
    'text',
    'number',
    'boolean',
    'date',
    'select'
);


ALTER TYPE public.field_type OWNER TO neondb_owner;

--
-- Name: payment_period; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.payment_period AS ENUM (
    'monthly',
    'quarterly',
    'yearly'
);


ALTER TYPE public.payment_period OWNER TO neondb_owner;

--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'pending',
    'expired',
    'canceled'
);


ALTER TYPE public.subscription_status OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'client'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: custom_fields; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.custom_fields (
    id integer NOT NULL,
    entity_type text NOT NULL,
    entity_id integer NOT NULL,
    field_name text NOT NULL,
    field_type public.field_type NOT NULL,
    field_value text,
    is_visible_for_user boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_required boolean DEFAULT false,
    min_value double precision,
    max_value double precision,
    min_length integer,
    max_length integer,
    pattern text,
    options text
);


ALTER TABLE public.custom_fields OWNER TO neondb_owner;

--
-- Name: custom_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.custom_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_fields_id_seq OWNER TO neondb_owner;

--
-- Name: custom_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.custom_fields_id_seq OWNED BY public.custom_fields.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.services (
    id integer NOT NULL,
    title text NOT NULL,
    icon_url text,
    description text,
    cashback text,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true,
    is_custom boolean DEFAULT false,
    owner_id integer,
    commission text
);


ALTER TABLE public.services OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    service_id integer,
    title text NOT NULL,
    domain text,
    login_id text,
    payment_period public.payment_period DEFAULT 'monthly'::public.payment_period,
    paid_until timestamp without time zone,
    payment_amount double precision,
    licenses_count integer DEFAULT 1,
    users_count integer DEFAULT 1,
    status public.subscription_status DEFAULT 'active'::public.subscription_status,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO neondb_owner;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO neondb_owner;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO neondb_owner;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO neondb_owner;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text,
    phone text,
    name text,
    company_name text,
    telegram_id text,
    is_active boolean DEFAULT true NOT NULL,
    role public.user_role DEFAULT 'client'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    telegram_chat_id text
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: custom_fields id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_fields ALTER COLUMN id SET DEFAULT nextval('public.custom_fields_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: custom_fields; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.custom_fields (id, entity_type, entity_id, field_name, field_type, field_value, is_visible_for_user, created_at, updated_at, is_required, min_value, max_value, min_length, max_length, pattern, options) FROM stdin;
1	service	4	НОВОЕ ПОЛЕ	text	Значение по умолчанию	t	2025-05-07 07:50:29.374714	2025-05-07 07:50:29.374714	f	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.services (id, title, icon_url, description, cashback, custom_fields, created_at, updated_at, is_active, is_custom, owner_id, commission) FROM stdin;
1	Google	\N		\N	{}	2025-04-11 13:45:23.645223	2025-04-11 13:45:23.645223	t	f	\N	\N
3	Wazzup24	\N		10%	{}	2025-04-28 19:57:56.433476	2025-04-28 19:57:56.433476	t	f	\N	\N
2	amoCRM	\N		10%	{}	2025-04-28 19:57:35.421326	2025-04-28 19:58:03.803	t	f	\N	\N
4	Алиллуйа	\N	Custom service	\N	{}	2025-05-07 04:24:14.626319	2025-05-07 04:24:14.626319	t	t	2	\N
5	Карамба	\N	Custom service	\N	{}	2025-05-07 06:42:32.845422	2025-05-07 06:42:32.845422	t	t	2	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
RrI6kmHxgv0j0nXSmOYi4T1VLBfgCcVi	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-30T09:30:41.555Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-06-06 09:47:15
LBe_uUItnGn8Q8FzVQMfxPCTexaMovnF	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-11T13:24:45.490Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":4}}	2025-05-11 13:24:46
XGey8ybb-UcxAiGtKx6sRwppNMmiURKM	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:10:29.824Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:10:31
VhgPKXM74CT0zxaGYva5S85-8lRCXx2u	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:11:09.246Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:11:11
ihBCo6quLAMkfgF-cS1MMigXpAt5KWyP	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:03:42.567Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:03:43
8eBW9mq3DHsIAwArnHOl_cG95pCUSysC	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:06:13.683Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:06:15
k-2Qo5bOJKOdPoeykIrRqRSlVoJ1SylL	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:08:01.411Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:08:03
R5w0IqaP0gGYZs1vv8qOZGwBPspWh-4G	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-06T15:32:42.997Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":4}}	2025-06-06 15:56:24
oJm-NWXEo7TciStUxHxzp0yJCds4hEFW	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:11:45.551Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:11:47
O-6NN4anLVRDoRq2CGMuqFAqZU0m9M8o	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:08:52.829Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:08:54
qY4GlJ9Eolkyhx8ToLhek8xc3zQ9kYnh	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-22T15:03:57.065Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":5}}	2025-05-22 15:04:17
FSTmqpXBo8nlnLN1h2YcHrS4_iFbgT-5	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-06-06T15:00:44.399Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-06 15:07:07
mL-pTkvpLt6-rLBsJHxgReAknvAUGEk_	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-28T19:56:48.239Z","secure":true,"httpOnly":true,"path":"/"}}	2025-05-28 19:56:49
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscriptions (id, user_id, service_id, title, domain, login_id, payment_period, paid_until, payment_amount, licenses_count, users_count, status, created_at, updated_at) FROM stdin;
2	6	1	Zoom	\N	\N	monthly	\N	\N	1	1	active	2025-04-28 19:34:18.26861	2025-04-28 19:54:54.966
4	6	3	Wazzuup	\N	\N	monthly	\N	\N	1	1	active	2025-04-28 19:55:03.942349	2025-04-28 19:58:45.136
3	6	2	amoCRM	1234	124124	monthly	\N	12424	1	1	active	2025-04-28 19:35:34.567162	2025-04-28 19:59:12.204
7	2	\N	New other sub	\N	\N	monthly	\N	\N	1	1	active	2025-05-05 10:02:11.928011	2025-05-05 10:02:11.928011
8	2	\N	Новая подписка	\N	\N	monthly	\N	\N	1	1	active	2025-05-07 04:15:04.233122	2025-05-07 04:15:04.233122
9	2	4	Ещё новее	\N	\N	monthly	\N	\N	1	1	active	2025-05-07 04:24:15.014692	2025-05-07 04:24:15.014692
10	2	5	Самая новая подписка	\N	\N	monthly	\N	\N	1	1	active	2025-05-07 06:42:33.235249	2025-05-07 06:42:33.235249
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.system_settings (id, key, value, created_at, updated_at) FROM stdin;
1	db_monitoring_enabled	true	2025-05-07 12:32:03.779285	2025-05-07 14:59:59.977735
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password_hash, phone, name, company_name, telegram_id, is_active, role, created_at, updated_at, telegram_chat_id) FROM stdin;
3	admin@example.com	a622de641e4dd331426c6ddc2c3e0a183e9302ca4cceb70ce44f3308eb25631cdda67d8bd88b5e3d0346391165fba1ddab0cbda51fa5d7bc0d192e94c398ef9f.9f86d081884c7d659a2feaa0c55ad015	\N	Administrator	\N	\N	t	admin	2025-04-11 13:10:01.479228	2025-04-11 13:10:01.479228	\N
4	admin2@example.com	c2b5b79a23b43e7d8835fa37786a610d468363ee011c3dfff582aa30b60fb8177c12edfbf663c4cd06f1ffe43124b7d13843cc5231c9a48bd1f5204806b42259.ea29d66d1edfff55033ecc49ab69a8fe		Admin User	Admin Company	\N	t	admin	2025-04-11 13:24:45.388347	2025-04-11 13:24:45.388347	\N
2	1@mail.ru	980ea2a9e6dc1fc7bede505195a9e6ff0aa5536ddab745169736254845edc9c1880f1016bde0e5e71fb57590ea9dc12d635ebd80a7097b29fc2c82953a2da22a.cdac964cf632cd636abdbea28f4d7e2c		Ivan		\N	t	client	2025-04-10 09:31:38.331999	2025-04-10 09:31:38.331999	100755549
5	admin@debug.local	14848e1541b931a07d654a79ee12adb7f2bc23974bc9ddca7635f980ea8959466537d0242586c756e3400cc4713e5cd37573295df49745a339bc4328947ae2fc.e9c1ac201b4b33865673dcbdfa780443		Debug Admin	Debug Company	\N	t	admin	2025-04-21 18:44:57.293641	2025-04-21 18:44:57.293641	\N
6	iz@simsales.ru	967a6906af1710d260f52cfa991faf2f6382eca7134675505008239328a26f1b37916077438cc7f72c4e789608fd8d16260706cf319688dce661770dea7d312e.b6ed05ce8353731fd9e0c5420a2f8f41		Иван		\N	t	client	2025-04-23 15:28:35.66751	2025-04-23 15:28:35.66751	\N
7	2@mail.ru	b65ad50ae3d36d59663cc164bfca157a78bfeab1f17008b597ddc9f4cd03cfadf85f5814ff3a2c16e04d8fb548c9913c277ba84d3174c5af1b63752b3bdc171a.a47d75ce57c8d9e6345a0d1af50e44f2		Тест		\N	t	client	2025-05-07 06:23:05.429869	2025-05-07 06:23:05.429869	\N
\.


--
-- Name: custom_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.custom_fields_id_seq', 1, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.services_id_seq', 5, true);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 10, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: custom_fields custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT custom_fields_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: services services_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: subscriptions subscriptions_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: subscriptions subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

