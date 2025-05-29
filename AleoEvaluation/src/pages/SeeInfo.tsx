// src/pages/SeeInfo.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import styles from './css/SeeInfo.module.css';

type InfoRow = {
  id: string;
  information_name: string;
  created_at: string;
  valide: boolean;
  company: { name: string; country: string; company_type: string } | null;
};

type SortColumn =
  | 'information_name'
  | 'company.name'
  | 'company.country'
  | 'company.company_type'
  | 'created_at'
  | 'valide';

export default function SeeInfo() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<InfoRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterValide, setFilterValide] = useState<'all' | 'true' | 'false'>('all');

  const [sortCol, setSortCol] = useState<SortColumn>('created_at');
  const [asc, setAsc] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let q = supabase
        .from<InfoRow>('information')
        .select(`
          id,
          information_name,
          created_at,
          valide,
          company:company_id(name, country, company_type)
        `);

      if (searchName) q = q.ilike('information_name', `%${searchName}%`);
      if (filterValide !== 'all') q = q.eq('valide', filterValide === 'true');
      if (filterCompany) q = q.eq('company.name', filterCompany);
      if (filterCountry) q = q.eq('company.country', filterCountry);
      if (filterType) q = q.eq('company.company_type', filterType);

      if (sortCol.startsWith('company.')) {
        const col = sortCol.split('.')[1];
        q = q.order(col, { foreignTable: 'company', ascending: asc });
      } else {
        q = q.order(sortCol, { ascending: asc });
      }

      const { data, error } = await q;
      if (error) console.error(error);
      setRows(data || []);
      setLoading(false);
    };
    fetch();
  }, [searchName, filterValide, filterCompany, filterCountry, filterType, sortCol, asc]);

  const companies = Array.from(new Set(rows.map(r => r.company?.name).filter(Boolean)));
  const countries = Array.from(new Set(rows.map(r => r.company?.country).filter(Boolean)));
  const types = Array.from(new Set(rows.map(r => r.company?.company_type).filter(Boolean)));

  const onSort = (col: SortColumn) => {
    if (sortCol === col) setAsc(!asc);
    else {
      setSortCol(col);
      setAsc(true);
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.returnButton} onClick={() => {navigate("/Acceuil"); return;}}>Return</button>
      <h1 className={styles.title}>Liste des informations disponibles</h1>

      <div className={styles.filters}>
        <input
          className={styles.input}
          placeholder="Rechercher nom…"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
        />
        <select className={styles.select} value={filterValide} onChange={e => setFilterValide(e.target.value as any)}>
          <option value="all">Tous statuts</option>
          <option value="true">Valide</option>
          <option value="false">Invalide</option>
        </select>
        <select className={styles.select} value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
          <option value="">Toutes entreprises</option>
          {companies.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className={styles.select} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
          <option value="">Tous pays</option>
          {countries.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className={styles.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous types</option>
          {types.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loader}>Chargement…</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => onSort('information_name')}>Information {sortCol === 'information_name' ? (asc ? '▲' : '▼') : ''}</th>
                <th onClick={() => onSort('company.name')}>Entreprise {sortCol === 'company.name' ? (asc ? '▲' : '▼') : ''}</th>
                <th onClick={() => onSort('company.country')}>Pays {sortCol === 'company.country' ? (asc ? '▲' : '▼') : ''}</th>
                <th onClick={() => onSort('company.company_type')}>Type {sortCol === 'company.company_type' ? (asc ? '▲' : '▼') : ''}</th>
                <th onClick={() => onSort('created_at')}>Créé le {sortCol === 'created_at' ? (asc ? '▲' : '▼') : ''}</th>
                <th onClick={() => onSort('valide')}>Statut {sortCol === 'valide' ? (asc ? '▲' : '▼') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    Aucun résultat
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} onClick={() => navigate(`/information/${r.id}`)} className={styles.clickableRow}>
                    <td>{r.information_name}</td>
                    <td>{r.company?.name || '-'}</td>
                    <td>{r.company?.country || '-'}</td>
                    <td>{r.company?.company_type || '-'}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <span
                        title={r.valide ? 'Valide' : 'Invalide'}
                        className={r.valide ? styles.badgeValid : styles.badgeInvalid}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
