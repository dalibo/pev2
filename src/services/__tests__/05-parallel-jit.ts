import { PlanService } from '@/services/plan-service';
import { IPlan } from '@/iplan';

import { findNodeById } from '@/services/help-service';

// In this plan, we have JIT info in the workers detail

describe('PlanService', () => {
  const planService = new PlanService();
  // tslint:disable:max-line-length
  const source = `
Nested Loop  (cost=210819.08..642686.86 rows=1 width=27) (actual time=1624.328..1631.028 rows=0 loops=1)
  Output: achatsentete.total_ht_net, devises.code_devise, devise_main.code_devise, devises.id_devise, devise_main.id_devise
  Inner Unique: true
  Join Filter: (achatslignes.id_cumul = cumuls.id_cumul)
  Buffers: shared hit=87
  ->  Nested Loop  (cost=210819.08..642685.32 rows=1 width=35) (actual time=1624.327..1631.026 rows=0 loops=1)
        Output: achatslignes.id_cumul, achatsentete.total_ht_net, devises.code_devise, devises.id_devise, devise_main.code_devise, devise_main.id_devise
        Buffers: shared hit=87
        ->  Nested Loop  (cost=210818.80..642682.82 rows=1 width=43) (actual time=1624.326..1631.025 rows=0 loops=1)
              Output: achatslignes.id_sigle, achatslignes.id_cumul, achatsentete.total_ht_net, devises.code_devise, devises.id_devise, devise_main.code_devise, devise_main.id_devise
              Inner Unique: true
              Join Filter: (achatslignes.id_tva = tva.id_tva)
              Buffers: shared hit=87
              ->  Gather  (cost=210818.80..642681.62 rows=1 width=51) (actual time=1624.325..1631.022 rows=0 loops=1)
                    Output: achatslignes.id_sigle, achatslignes.id_tva, achatslignes.id_cumul, achatsentete.total_ht_net, devises.code_devise, devises.id_devise, devise_main.code_devise, devise_main.id_devise
                    Workers Planned: 2
                    Workers Launched: 2
                    Buffers: shared hit=87
                    ->  Parallel Hash Join  (cost=209818.80..641681.52 rows=1 width=51) (actual time=1599.512..1599.522 rows=0 loops=3)
                          Output: achatslignes.id_sigle, achatslignes.id_tva, achatslignes.id_cumul, achatsentete.total_ht_net, devises.code_devise, devises.id_devise, devise_main.code_devise, devise_main.id_devise
                          Hash Cond: (client_main.id_client = ve_main.id_client)
                          Buffers: shared hit=87
                          Worker 0:  actual time=1583.718..1583.725 rows=0 loops=1
                            JIT:
                              Functions: 49
                              Options: Inlining true, Optimization true, Expressions true, Deforming true
                              Timing: Generation 11.376 ms, Inlining 86.302 ms, Optimization 1075.176 ms, Emission 420.294 ms, Total 1593.149 ms
                            Buffers: shared hit=41
                          Worker 1:  actual time=1591.988..1591.998 rows=0 loops=1
                            JIT:
                              Functions: 49
                              Options: Inlining true, Optimization true, Expressions true, Deforming true
                              Timing: Generation 8.759 ms, Inlining 61.313 ms, Optimization 678.793 ms, Emission 407.355 ms, Total 1156.220 ms
                            Buffers: shared hit=41
                          ->  Hash Left Join  (cost=1.07..413566.76 rows=4879205 width=19) (never executed)
                                Output: client_main.id_client, devise_main.code_devise, devise_main.id_devise
                                Inner Unique: true
                                Hash Cond: (client_main.id_devise = devise_main.id_devise)
                                ->  Parallel Seq Scan on aristote_mdl.clients client_main  (cost=0.00..382664.05 rows=4879205 width=16) (never executed)
                                      Output: client_main.id_prof_tarif_art, client_main.cl_id_printer, client_main.id_prof_tarif_fam, client_main.id_client2, client_main.id_division, client_main.cl_id_block_level, client_main.id_tarif, client_main.cl_date_modif, client_main.id_titre, client_main.cl_countsalaries, client_main.id_regl, client_main.id_groupe, client_main.delai_alarme, client_main.id_priorite, client_main.id_nb_jrs_val, client_main.cl_datelastmvt, client_main.cl_pour_marge_mini, client_main.cl_date_creat, client_main.encours_autorise, client_main.id_process, client_main.id_repres, client_main.mini_cmde, client_main.cl_id_ech_fact, client_main.cl_id_cli_relev, client_main.id_ech, client_main.id_cli_fact, client_main.id_depot, client_main.cl_id_currency, client_main.id_prof_tarif_savhg, client_main.mt_dev_preacc, client_main.id_client, client_main.id_famille, client_main.id_pays, client_main.cl_idreasoncustblock, client_main.id_delivery_mode, client_main.cl_id_invoicemerge, client_main.id_prof_tarif_savsg, client_main.id_devise, client_main.cl_id_user_modif, client_main.ca_fact_port, client_main.cl_idstartstatus, client_main.chk_specif_entree, client_main.chk_enter_mobile_phone_nb, client_main.prenom, client_main.nom, client_main.chk_enter_pre_post, client_main.chk_access_pre_post_pay, client_main.chk_2dis_if_no_bt_flat_file, client_main.chk_count_box_goods_in, client_main.chk_calc_encours_ech, client_main.cl_bank_iban, client_main.adresse_2, client_main.chk_blocage, client_main.cl_bank_bic, client_main.num_ident_cee, client_main.fax, client_main.chk_disp_if_custom_dam, client_main.chk_access_empty_bag, client_main.chk_access_branch_store_code, client_main.code_postal, client_main.chk_enter_sub_channel, client_main.code_bqe, client_main.chk_2dis_if_obsolete_prod, client_main.adresse_1, client_main.chk_enter_branch_store_code, client_main.adresse_4, client_main.chk_check_cust_ref_table, client_main.chk_access_portable_nb, client_main.cl_extranet_password, client_main.num_cptebq, client_main.chk_access_cust_damaged, client_main.code_client, client_main.chk_access_reason_ret, client_main.id_langue, client_main.obs, client_main.dom_bqe_adr2, client_main.chk_transf_ngroup, client_main.cl_blocage_comment, client_main.chk_enter_sos_code, client_main.chk_enter_type_of_return, client_main.site_internet, client_main.chk_car_kit_process, client_main.chk_24ex, client_main.chk_del_numb, client_main.chk_access_used_prod, client_main.votre_code, client_main.portable, client_main.chk_access_miss_acc, client_main.code_ape, client_main.chk_to_qa, client_main.chk_access_net, client_main.chk_rel_fin_mois, client_main.num_cpte, client_main.chk_skip_cust_ref, client_main.adresse_3, client_main.chk_enter_reason_for_return, client_main.chk_enter_cust_account_nb, client_main.chk_enter_network, client_main.telephone, client_main.ville, client_main.num_siret, client_main.code_guichet, client_main.cl_pourc_escompte, client_main.chk_enter_proof_purchase, client_main.chk_enter_bus_sector, client_main.chk_noreliquat, client_main.dom_bqe_adr1, client_main.chk_export, client_main.clef_rib, client_main.cl_idsigle_transf_sav_vte, client_main.chk_access_proof_purch, client_main.chk_del_mod, client_main.email, client_main.chk_access_obsolete_prod, client_main.cl_noestimate, client_main.cl_chk_autotransf_sav_vte, client_main.cl_chkclientgenerique, client_main.cl_chkinternalclient, client_main.cl_decimal_count, client_main.cl_chkignoredistcustcust, client_main.cl_chkignoredisttechcust, client_main.cl_chkenterprise, client_main.cl_chkignoresecteurinterv, client_main.cl_password
                                ->  Hash  (cost=1.03..1.03 rows=3 width=11) (never executed)
                                      Output: devise_main.code_devise, devise_main.id_devise
                                      ->  Seq Scan on aristote_mdl.devises devise_main  (cost=0.00..1.03 rows=3 width=11) (never executed)
                                            Output: devise_main.code_devise, devise_main.id_devise
                          ->  Parallel Hash  (cost=209817.72..209817.72 rows=1 width=48) (actual time=1599.389..1599.395 rows=0 loops=3)
                                Output: ve_main.id_client, achatslignes.id_sigle, achatslignes.id_tva, achatslignes.id_cumul, achatsentete.total_ht_net, devises.code_devise, devises.id_devise
                                Buckets: 1024  Batches: 1  Memory Usage: 0kB
                                Buffers: shared hit=23
                                Worker 0:  actual time=1583.596..1583.600 rows=0 loops=1
                                  Buffers: shared hit=9
                                Worker 1:  actual time=1591.903..1591.911 rows=0 loops=1
                                  Buffers: shared hit=9
                                ->  Hash Join  (cost=27.55..209817.72 rows=1 width=48) (actual time=1435.827..1435.833 rows=0 loops=3)
                                      Output: ve_main.id_client, achatslignes.id_sigle, achatslignes.id_tva, achatslignes.id_cumul, achatsentete.total_ht_net, devises.code_devise, devises.id_devise
                                      Hash Cond: (achatsentete.id_siglnum = achatslignes.id_siglnum)
                                      Buffers: shared hit=23
                                      Worker 0:  actual time=1583.528..1583.531 rows=0 loops=1
                                        Buffers: shared hit=9
                                      Worker 1:  actual time=1149.484..1149.490 rows=0 loops=1
                                        Buffers: shared hit=9
                                      ->  Hash Left Join  (cost=1.07..202623.87 rows=1911294 width=24) (actual time=1435.775..1435.777 rows=1 loops=3)
                                            Output: achatsentete.total_ht_net, achatsentete.id_siglnum, devises.code_devise, devises.id_devise
                                            Inner Unique: true
                                            Hash Cond: (achatsentete.id_devise = devises.id_devise)
                                            Buffers: shared hit=6
                                            Worker 0:  actual time=1583.464..1583.466 rows=1 loops=1
                                              Buffers: shared hit=2
                                            Worker 1:  actual time=1149.424..1149.426 rows=1 loops=1
                                              Buffers: shared hit=2
                                            ->  Parallel Seq Scan on aristote_mdl.achatsentete  (cost=0.00..190517.94 rows=1911294 width=21) (actual time=0.009..0.009 rows=1 loops=3)
                                                  Output: achatsentete.id_devise, achatsentete.ach_id_achatscondregl, achatsentete.id_fourn_inter, achatsentete.total_transfered, achatsentete.id_pays_fourn, achatsentete.id_user, achatsentete.total_ht_net, achatsentete.id_siglnum, achatsentete.ach_id_user_modif, achatsentete.id_pays_inter, achatsentete.id_client, achatsentete.pourc_escompte, achatsentete.id_type_achat, achatsentete.total_regle, achatsentete.datec, achatsentete.ach_status_date, achatsentete.total_ht_brut, achatsentete.ach_id_status, achatsentete.ach_last_print_date, achatsentete.id_division, achatsentete.id_niv_bloc, achatsentete.ach_date_modif, achatsentete.id_fourn, achatsentete.print_date, achatsentete.ach_conv_devise, achatsentete.date_bloc, achatsentete.total_ttc_net, achatsentete.id_client_livr, achatsentete.id_sigle, achatsentete.ach_fax_fourn, achatsentete.num_regroup, achatsentete.code_postal_fourn, achatsentete.ach_fax_inter, achatsentete.ach_telephone_fourn, achatsentete.nom_inter, achatsentete.code_postal_inter, achatsentete.ach_account_journal, achatsentete.ach_account_num2, achatsentete.crit_tri, achatsentete.adresse_inter_3, achatsentete.adresse_fourn_3, achatsentete.chk_security, achatsentete.adresse_fourn_2, achatsentete.ach_oldnumber, achatsentete.numero, achatsentete.chk_valid_cmde, achatsentete.chk_calcul_totaux, achatsentete.total_ht_remise, achatsentete.ach_portable_inter, achatsentete.ach_telephone_inter, achatsentete.adresse_inter_4, achatsentete.adresse_fourn_1, achatsentete.prenom_inter, achatsentete.ville_inter, achatsentete.ach_account_discount, achatsentete.ach_portable_fourn, achatsentete.ach_email_inter, achatsentete.adresse_inter_1, achatsentete.chk_reliquat, achatsentete.ach_account_num1, achatsentete.obs, achatsentete.ville_fourn, achatsentete.ref_fourn, achatsentete.ach_status_comment, achatsentete.ach_email_fourn, achatsentete.adresse_inter_2, achatsentete.adresse_fourn_4, achatsentete.chk_blocage, achatsentete.nom_fourn, achatsentete.ach_chk_num_def, achatsentete.ach_print_lock
                                                  Buffers: shared hit=3
                                                  Worker 0:  actual time=0.011..0.011 rows=1 loops=1
                                                    Buffers: shared hit=1
                                                  Worker 1:  actual time=0.010..0.011 rows=1 loops=1
                                                    Buffers: shared hit=1
                                            ->  Hash  (cost=1.03..1.03 rows=3 width=11) (actual time=1435.715..1435.716 rows=3 loops=3)
                                                  Output: devises.code_devise, devises.id_devise
                                                  Buckets: 1024  Batches: 1  Memory Usage: 9kB
                                                  Buffers: shared hit=3
                                                  Worker 0:  actual time=1583.414..1583.415 rows=3 loops=1
                                                    Buffers: shared hit=1
                                                  Worker 1:  actual time=1149.395..1149.396 rows=3 loops=1
                                                    Buffers: shared hit=1
                                                  ->  Seq Scan on aristote_mdl.devises  (cost=0.00..1.03 rows=3 width=11) (actual time=1435.684..1435.696 rows=3 loops=3)
                                                        Output: devises.code_devise, devises.id_devise
                                                        Buffers: shared hit=3
                                                        Worker 0:  actual time=1583.391..1583.395 rows=3 loops=1
                                                          Buffers: shared hit=1
                                                        Worker 1:  actual time=1149.370..1149.374 rows=3 loops=1
                                                          Buffers: shared hit=1
                                      ->  Hash  (cost=26.47..26.47 rows=1 width=40) (actual time=0.039..0.042 rows=0 loops=3)
                                            Output: ve_main.id_client, achatslignes.id_siglnum, achatslignes.id_sigle, achatslignes.id_tva, achatslignes.id_cumul
                                            Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                            Buffers: shared hit=17
                                            Worker 0:  actual time=0.051..0.053 rows=0 loops=1
                                              Buffers: shared hit=7
                                            Worker 1:  actual time=0.049..0.052 rows=0 loops=1
                                              Buffers: shared hit=7
                                            ->  Nested Loop  (cost=1.44..26.47 rows=1 width=40) (actual time=0.038..0.040 rows=0 loops=3)
                                                  Output: ve_main.id_client, achatslignes.id_siglnum, achatslignes.id_sigle, achatslignes.id_tva, achatslignes.id_cumul
                                                  Inner Unique: true
                                                  Buffers: shared hit=17
                                                  Worker 0:  actual time=0.051..0.052 rows=0 loops=1
                                                    Buffers: shared hit=7
                                                  Worker 1:  actual time=0.048..0.051 rows=0 loops=1
                                                    Buffers: shared hit=7
                                                  ->  Nested Loop  (cost=1.00..24.36 rows=1 width=40) (actual time=0.038..0.039 rows=0 loops=3)
                                                        Output: vl_main.id_siglnum, achatslignes.id_siglnum, achatslignes.id_sigle, achatslignes.id_tva, achatslignes.id_cumul
                                                        Inner Unique: true
                                                        Buffers: shared hit=17
                                                        Worker 0:  actual time=0.050..0.051 rows=0 loops=1
                                                          Buffers: shared hit=7
                                                        Worker 1:  actual time=0.048..0.049 rows=0 loops=1
                                                          Buffers: shared hit=7
                                                        ->  Index Scan using achatslignes_al_id_linked_line on aristote_mdl.achatslignes  (cost=0.43..21.57 rows=1 width=40) (actual time=0.037..0.037 rows=0 loops=3)
                                                              Output: achatslignes.al_status_date, achatslignes.al_creation_date, achatslignes.qte_a_transf, achatslignes.id_mode_livr, achatslignes.al_transfer_stamp, achatslignes.id_siglnumlig_transf, achatslignes.al_id_achatline_creator, achatslignes.al_id_siglnumlig_first_orig, achatslignes.al_id_condition, achatslignes.id_siglnumlig, achatslignes.qte, achatslignes.al_lock_transaction_id, achatslignes.id_savartcmde, achatslignes.pu_ttc_article, achatslignes.al_id_fourn_transf, achatslignes.id_tva, achatslignes.id_siglnum, achatslignes.id_siglnumligori_vte, achatslignes.al_id_supplier_orig, achatslignes.id_depot, achatslignes.al_lock_transaction_pass, achatslignes.qte_globale, achatslignes.num_ligne_lien, achatslignes.qte_a_transf_sup, achatslignes.al_status_id_user, achatslignes.qte_reliquat, achatslignes.id_siglnumsaventete, achatslignes.al_id_master_status, achatslignes.al_chk_transferable, achatslignes.al_id_status, achatslignes.al_id_hidden_line, achatslignes.id_siglnumori_vte, achatslignes.id_type_achat, achatslignes.id_article, achatslignes.al_id_warranty, achatslignes.id_siglnum_transf, achatslignes.id_lig_group, achatslignes.qte_achat, achatslignes.id_cumul, achatslignes.pourc_rem, achatslignes.al_qte_transfert, achatslignes.al_id_linked_line, achatslignes.pu_ht_article, achatslignes.id_sigle_ori, achatslignes.al_id_sigle_transf, achatslignes.al_bkp_id_sigle_ori, achatslignes.al_id_blocklevel_orig, achatslignes.al_id_article_transfer, achatslignes.al_id_savartretour, achatslignes.id_division, achatslignes.al_id_article_att, achatslignes.delai_jrs, achatslignes.num_ligne, achatslignes.al_id_warranty_reason, achatslignes.id_sigle, achatslignes.id_niv_bloc, achatslignes.id_siglnumori_ach, achatslignes.al_lock_transaction_date, achatslignes.id_siglnumligori_ach, achatslignes.libelle_det, achatslignes.ser_num2, achatslignes.pu_ht, achatslignes.al_bkp_id_siglnumori_vte, achatslignes.al_status_comment, achatslignes.al_pourc_rem_transfer, achatslignes.al_pu_ht_transfer, achatslignes.chk_edition_imprime, achatslignes.id_siglnum_const, achatslignes.chk_gest_stock, achatslignes.pu_ttc, achatslignes.chk_transfert, achatslignes.ser_num1, achatslignes.al_ser_num1_transfer, achatslignes.chk_prise_en_cpte_calc_gen, achatslignes.al_bkp_id_siglnumligori_vte, achatslignes.al_ref_fourn_transf, achatslignes.al_ser_num2_transfer, achatslignes.ref_fourn, achatslignes.chk_nomencl_pa, achatslignes.al_folder_id, achatslignes.num_compte, achatslignes.libelle, achatslignes.al_imei_stock, achatslignes.num_ligne_tri, achatslignes.al_id_siglnumetap_fab, achatslignes.al_chk_import_delai, achatslignes.al_requested_status_date, achatslignes.al_server_status_date, achatslignes.al_user_system_status_date, achatslignes.al_linked_product_info_id
                                                              Index Cond: (achatslignes.al_id_linked_line = 829721)
                                                              Filter: (achatslignes.id_sigle = 306)
                                                              Buffers: shared hit=17
                                                              Worker 0:  actual time=0.049..0.049 rows=0 loops=1
                                                                Buffers: shared hit=7
                                                              Worker 1:  actual time=0.047..0.048 rows=0 loops=1
                                                                Buffers: shared hit=7
                                                        ->  Index Scan using venteslignes_id_siglnumlig_id_siglnumlig_ori on aristote_mdl.venteslignes vl_main  (cost=0.56..2.78 rows=1 width=16) (never executed)
                                                              Output: vl_main.vl_id_sigle_transf, vl_main.id_cumul, vl_main.vl_id_master_status, vl_main.qte_cmd_achat, vl_main.vl_id_article_orig, vl_main.vl_id_warranty, vl_main.id_article, vl_main.id_siglnum_transf, vl_main.vl_chk_transferable, vl_main.id_lig_group, vl_main.prix_achat, vl_main.pourc_rem, vl_main.id_sigle_ori, vl_main.pu_ht_article, vl_main.id_savartfac, vl_main.vl_status_id_user, vl_main.id_mode_exped, vl_main.num_ligne_tri, vl_main.id_siglnumlig_ori, vl_main.id_division, vl_main.id_niv_bloc, vl_main.vl_last_exit_date, vl_main.delai_jrs, vl_main.vl_id_blisa01dc, vl_main.vl_id_hidden_line, vl_main.num_ligne, vl_main.id_sigle, vl_main.id_siglnumlig_transf, vl_main.id_siglnum_ori, vl_main.vl_id_linked_line, vl_main.qte_vente, vl_main.vl_lock_transaction_pass, vl_main.vl_lock_transaction_date, vl_main.prix_moyen_pond, vl_main.vl_id_siglnummat_sav_prepay, vl_main.vl_transfer_stamp, vl_main.qte_a_transf, vl_main.vl_creation_date, vl_main.id_tva, vl_main.vl_id_status, vl_main.id_siglnumlig, vl_main.qte, vl_main.vl_last_exit_depot, vl_main.pu_ttc_article, vl_main.vl_id_warranty_reason, vl_main.vl_client_delivery_id, vl_main.vl_lock_transaction_id, vl_main.qte_globale, vl_main.num_ligne_lien, vl_main.qte_transfert, vl_main.id_siglnum, vl_main.id_depot, vl_main.vl_id_supplier_transf, vl_main.vl_status_date, vl_main.vl_id_depend_group, vl_main.qte_a_transf_sup, vl_main.vl_id_client_fact, vl_main.vl_idadvplan, vl_main.id_siglnumsaventete, vl_main.qte_reliquat, vl_main.vl_id_contract, vl_main.vl_id_client_transf, vl_main.num_compte_marge, vl_main.chk_prise_en_cpte_calc_gen, vl_main.vl_ref_client_transf, vl_main.vl_bkp_id_siglnumlig_ach_orig, vl_main.vl_imei_stock, vl_main.libelle, vl_main.vl_ser_num1_transfer, vl_main.num_compte, vl_main.vl_id_siglnumlig_ach_orig, vl_main.vl_id_venteline_creator, vl_main.vl_status_comment, vl_main.libelle_det, vl_main.ser_num2, vl_main.vl_id_siglnumlig_first_orig, vl_main.vl_crit_tri_transf, vl_main.pu_ht, vl_main.vl_pmp_net, vl_main.vl_id_mod_exped_transf, vl_main.vl_ser_num2_transfer, vl_main.vl_id_condition, vl_main.chk_prise_en_cpte_marge, vl_main.chk_edition_imprime, vl_main.vl_remise_libelle, vl_main.pu_ttc, vl_main.chk_cmd_achat, vl_main.chk_transfert, vl_main.vl_folder_id, vl_main.ser_num1, vl_main.id_siglnum_const, vl_main.chk_gest_stock, vl_main.vl_chk_pmp_net_manual, vl_main.vl_requested_status_date, vl_main.vl_server_status_date, vl_main.vl_user_system_status_date, vl_main.vl_linked_product_info_id, vl_main.vl_code_article
                                                              Index Cond: (vl_main.id_siglnumlig = achatslignes.al_folder_id)
                                                  ->  Index Scan using pk_ventesentete on aristote_mdl.ventesentete ve_main  (cost=0.44..2.12 rows=1 width=16) (never executed)
                                                        Output: ve_main.id_devise, ve_main.vent_id_client_picking, ve_main.vent_id_status, ve_main.id_siglnum, ve_main.vent_date_modif, ve_main.total_transfered, ve_main.total_ht_remise, ve_main.id_user, ve_main.total_ht_net, ve_main.id_type_transport_cea, ve_main.id_pays_cli, ve_main.vent_def_id_mode_exped, ve_main.id_type_vente, ve_main.id_pays_fact, ve_main.id_client, ve_main.total_ttc_brut, ve_main.id_pays_inter, ve_main.total_regle, ve_main.vent_id_client_delivery, ve_main.id_banque_enc, ve_main.vent_last_print_date, ve_main.vent_id_user_modif, ve_main.pourc_escompte, ve_main.id_priorite, ve_main.vent_def_delay, ve_main.datec, ve_main.id_division, ve_main.vent_status_date, ve_main.total_ht_brut, ve_main.id_type_vt_cea, ve_main.date_bloc, ve_main.vent_id_ventescondregl, ve_main.total_ttc_net, ve_main.vent_idstate, ve_main.id_client_livr, ve_main.id_sigle, ve_main.id_niv_bloc, ve_main.vent_id_savrdvenlev, ve_main.id_pays_livr, ve_main.total_ttc_remise, ve_main.id_client_inter, ve_main.id_client_fact, ve_main.prenom_cli, ve_main.vent_num_cpte, ve_main.telephone_fact, ve_main.code_postal_inter, ve_main.nom_inter, ve_main.telephone_cli, ve_main.chk_security, ve_main.numero, ve_main.chk_calcul_totaux, ve_main.email_inter, ve_main.adresse_inter_3, ve_main.crit_tri, ve_main.fax_livr, ve_main.vent_oldnumber, ve_main.cea_depart, ve_main.adresse_livr_1, ve_main.adresse_fact_3, ve_main.cea_centre, ve_main.adresse_inter_4, ve_main.email_cli, ve_main.telephone_inter, ve_main.ref_client, ve_main.ville_cli, ve_main.cea_serv, ve_main.cea_groupe, ve_main.email_fact, ve_main.fax_cli, ve_main.adresse_fact_2, ve_main.portable_fact, ve_main.ville_livr, ve_main.adresse_fact_1, ve_main.adresse_fact_4, ve_main.adresse_livr_3, ve_main.vent_account_num1, ve_main.fax_fact, ve_main.adresse_livr_2, ve_main.cea_bat, ve_main.adresse_inter_1, ve_main.chk_reliquat, ve_main.telephone_livr, ve_main.prenom_inter, ve_main.ville_inter, ve_main.adresse_livr_4, ve_main.code_postal_fact, ve_main.vent_total_ht_net_marge, ve_main.portable_cli, ve_main.vent_state_livr, ve_main.nom_livr, ve_main.vent_account_journal, ve_main.code_postal_cli, ve_main.nom_fact, ve_main.adresse_cli_4, ve_main.cea_piece, ve_main.adresse_cli_1, ve_main.ville_fact, ve_main.vent_flashcount, ve_main.vent_account_num2, ve_main.portable_livr, ve_main.cea_crb, ve_main.portable_inter, ve_main.obs, ve_main.nom_cli, ve_main.cea_direct, ve_main.email_livr, ve_main.vent_status_comments, ve_main.adresse_inter_2, ve_main.adresse_cli_3, ve_main.cea_site, ve_main.fax_inter, ve_main.adresse_cli_2, ve_main.code_postal_livr, ve_main.chk_blocage, ve_main.prenom_livr, ve_main.prenom_fact, ve_main.vent_account_discount, ve_main.vent_chk_num_def, ve_main.vent_print_lock, ve_main.vent_calc_ttc_ht, ve_main.chk_blocage_escompte_auto, ve_main.vent_idsociete, ve_main.vent_archivingtarget
                                                        Index Cond: (ve_main.id_siglnum = vl_main.id_siglnum)
              ->  Seq Scan on aristote_mdl.tva  (cost=0.00..1.09 rows=9 width=8) (never executed)
                    Output: tva.id_division, tva.id_tva, tva.pourc_tva, tva.num_tva_vente, tva.code_tva, tva.chk_tva_def, tva.num_tva_achat, tva.chk_calc_marge
        ->  Index Only Scan using pk_sigle on aristote_mdl.sigle  (cost=0.28..2.49 rows=1 width=8) (never executed)
              Output: sigle.id_sigle
              Index Cond: (sigle.id_sigle = 306)
              Heap Fetches: 0
  ->  Seq Scan on aristote_mdl.cumuls  (cost=0.00..1.34 rows=16 width=8) (never executed)
        Output: cumuls.id_cumul, cumuls.id_division, cumuls.code_cumul, cumuls.libelle, cumuls.cml_id_accumulation_type, cumuls.cml_translation_01
        Filter: (cumuls.cml_id_accumulation_type = ANY ('{1,2,3,4,5,6,7}'::integer[]))
Planning:
  Buffers: shared hit=140
Planning Time: 4.413 ms
JIT:
  Functions: 157
  Options: Inlining true, Optimization true, Expressions true, Deforming true
  Timing: Generation 28.025 ms, Inlining 156.747 ms, Optimization 2847.422 ms, Emission 1298.889 ms, Total 4331.083 ms
Execution Time: 1639.241 ms
  `;

  const r: any = planService.fromSource(source);
  const plan: IPlan = planService.createPlan('', r, '');
  it('takes workers into account', () => {
    const parallelhashjoin = findNodeById(plan, 5);
  });
});
