--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.1
-- Dumped by pg_dump version 9.6.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: menus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE menus (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    price integer NOT NULL,
    description text,
    category character varying(100),
    image text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE menus OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE order_items (
    id integer NOT NULL,
    order_id integer,
    menu_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    price integer NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE order_items_id_seq OWNED BY order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE orders (
    id integer NOT NULL,
    table_id integer NOT NULL,
    table_name character varying(100) NOT NULL,
    items jsonb NOT NULL,
    total_price integer NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE orders_id_seq OWNED BY orders.id;


--
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE restaurant_tables (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    capacity integer NOT NULL,
    status character varying(50) DEFAULT 'kosong'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


ALTER TABLE restaurant_tables OWNER TO postgres;

--
-- Name: restaurant_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE restaurant_tables_id_seq
    START WITH 3
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE restaurant_tables_id_seq OWNER TO postgres;

--
-- Name: restaurant_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE restaurant_tables_id_seq OWNED BY restaurant_tables.id;


--
-- Name: tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE tables (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    capacity integer NOT NULL,
    status character varying(50) DEFAULT 'kosong'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE tables OWNER TO postgres;

--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_items ALTER COLUMN id SET DEFAULT nextval('order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq'::regclass);


--
-- Name: restaurant_tables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY restaurant_tables ALTER COLUMN id SET DEFAULT nextval('restaurant_tables_id_seq'::regclass);


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY menus (id, name, price, description, category, image, created_at, updated_at) FROM stdin;
11	Ayam Bakar	18000	Pedas Manis	Makanan	/uploads/menu-images/menu-1761287611011-730649958.jpg	2025-10-24 13:33:31.076291	2025-10-24 13:33:31.076291
13	Teh Manis	5000	Dingin/Hangat	Minuman	/uploads/menu-images/menu-1761287671234-146019742.jpg	2025-10-24 13:34:31.287206	2025-10-24 13:34:31.287206
14	Jus Jeruk	7000	Dingin	Minuman	/uploads/menu-images/menu-1761287690087-908971572.jpg	2025-10-24 13:34:50.144599	2025-10-24 13:34:58.559593
12	Sate Ayam	15000	Bumbu Kacang	Makanan	/uploads/menu-images/menu-1761287644967-996691785.jpg	2025-10-24 13:34:05.018995	2025-10-28 10:59:31.11222
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY order_items (id, order_id, menu_name, quantity, price, notes, created_at) FROM stdin;
1	6	Ayam Bakar	1	25000	Pedas	2025-11-01 22:46:11.548396
2	7	Teh Manis	1	5000	ga pedes	2025-11-01 22:47:06.072808
3	7	Sate Ayam	1	15000	pake es	2025-11-01 22:47:06.072808
4	8	Teh Manis	1	5000	ga pedes	2025-11-01 22:51:20.015934
5	8	Sate Ayam	1	15000	pake es	2025-11-01 22:51:20.015934
6	9	Sate Ayam	1	15000		2025-11-01 23:28:10.913408
7	9	Jus Jeruk	1	7000		2025-11-01 23:28:10.913408
8	10	Sate Ayam	1	15000		2025-11-01 23:28:22.943138
9	10	Jus Jeruk	1	7000		2025-11-01 23:28:22.943138
10	11	Teh Manis	1	5000		2025-11-01 23:31:32.717366
11	11	Ayam Bakar	1	18000		2025-11-01 23:31:32.717366
\.


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('order_items_id_seq', 11, true);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY orders (id, table_id, table_name, items, total_price, status, created_at, updated_at) FROM stdin;
6	1	Meja 1	[{"qty": 1, "nama": "Ayam Bakar", "harga": 25000, "catatan": "Pedas"}]	25000	pending	2025-11-01 22:46:11.548396	2025-11-01 22:46:11.548396
7	2	Meja 2	[{"qty": 1, "nama": "Teh Manis", "harga": 5000, "catatan": "ga pedes"}, {"qty": 1, "nama": "Sate Ayam", "harga": 15000, "catatan": "pake es"}]	20000	pending	2025-11-01 22:47:06.072808	2025-11-01 22:47:06.072808
8	2	Meja 2	[{"qty": 1, "nama": "Teh Manis", "harga": 5000, "catatan": "ga pedes"}, {"qty": 1, "nama": "Sate Ayam", "harga": 15000, "catatan": "pake es"}]	20000	pending	2025-11-01 22:51:20.015934	2025-11-01 22:51:20.015934
9	1	Meja 1	[{"qty": 1, "nama": "Sate Ayam", "harga": 15000, "catatan": ""}, {"qty": 1, "nama": "Jus Jeruk", "harga": 7000, "catatan": ""}]	22000	pending	2025-11-01 23:28:10.913408	2025-11-01 23:28:10.913408
10	1	Meja 1	[{"qty": 1, "nama": "Sate Ayam", "harga": 15000, "catatan": ""}, {"qty": 1, "nama": "Jus Jeruk", "harga": 7000, "catatan": ""}]	22000	pending	2025-11-01 23:28:22.943138	2025-11-01 23:28:22.943138
11	1	Meja 1	[{"qty": 1, "nama": "Teh Manis", "harga": 5000, "catatan": ""}, {"qty": 1, "nama": "Ayam Bakar", "harga": 18000, "catatan": ""}]	23000	pending	2025-11-01 23:31:32.717366	2025-11-01 23:31:32.717366
\.


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('orders_id_seq', 11, true);


--
-- Data for Name: restaurant_tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY restaurant_tables (id, name, capacity, status, created_at, updated_at) FROM stdin;
2	Meja 2	2	tersedia	2025-10-31 10:05:44.609427	2025-11-01 23:27:32.900689
1	Meja 1	4	terisi	2025-10-29 14:57:34.603792	2025-11-01 23:31:32.748562
\.


--
-- Name: restaurant_tables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('restaurant_tables_id_seq', 3, true);


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY tables (id, name, capacity, status, created_at) FROM stdin;
1	Meja 1	4	kosong	2025-10-24 13:53:28.010257
2	Meja 2	4	kosong	2025-10-24 13:53:28.010257
3	Meja 3	6	kosong	2025-10-24 13:53:28.010257
4	Meja 4	2	kosong	2025-10-24 13:53:28.010257
5	Meja 5	8	kosong	2025-10-24 13:53:28.010257
\.


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: restaurant_tables restaurant_tables_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY restaurant_tables
    ADD CONSTRAINT restaurant_tables_name_key UNIQUE (name);


--
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

