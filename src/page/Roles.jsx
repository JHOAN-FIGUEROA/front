"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  Pagination,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Chip,
} from "@mui/material"
import { getRoles, createRol, updateRol, deleteRol, updateEstadoRol, getRolById } from "../api"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import VisibilityIcon from "@mui/icons-material/Visibility"
import Buscador from "../components/Buscador"
import CambiarEstado from "../components/CambiarEstado"
import Eliminar from "../components/Eliminar"
import AddIcon from "@mui/icons-material/Add"
import { useSearchParams } from "react-router-dom"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"
import InfoIcon from "@mui/icons-material/Info"
import SecurityIcon from "@mui/icons-material/Security"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"

const ROLES_POR_PAGINA = 5

const PERMISOS_DISPONIBLES = [
  { id: 1, nombre: "Dashboard" },
  { id: 2, nombre: "Usuarios" },
  { id: 3, nombre: "Roles" },
  { id: 4, nombre: "Compras" },
  { id: 5, nombre: "Proveedores" },
  { id: 6, nombre: "Categorías" },
  { id: 7, nombre: "Productos" },
  { id: 8, nombre: "Ventas" },
  { id: 9, nombre: "Clientes" },
]

const Roles = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("") // Error para la carga principal de la lista

  const [searchParams, setSearchParams] = useSearchParams()
  const [pagina, setPagina] = useState(Number.parseInt(searchParams.get("page")) || 1)
  const [busqueda, setBusqueda] = useState(searchParams.get("search") || "")

  const [totalPaginasAPI, setTotalPaginasAPI] = useState(1)

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })

  const [eliminarOpen, setEliminarOpen] = useState(false)
  const [rolEliminar, setRolEliminar] = useState(null)

  const [crearOpen, setCrearOpen] = useState(false)
  const [nuevoRol, setNuevoRol] = useState({ nombre: "", descripcion: "", permisos_ids: [] })
  const [crearLoading, setCrearLoading] = useState(false)
  const [crearError, setCrearError] = useState("") // Para Alert dentro del diálogo Crear

  const [editRolOpen, setEditRolOpen] = useState(false)
  const [rolAEditar, setRolAEditar] = useState(null)
  const [editRolData, setEditRolData] = useState({ nombre: "", descripcion: "", permisos_ids: [] })
  const [originalEditRolData, setOriginalEditRolData] = useState(null) // Nuevo estado para datos originales
  const [editRolLoading, setEditRolLoading] = useState(false)
  const [editRolError, setEditRolError] = useState("") // Para Alert dentro del diálogo Editar
  const [editValidationErrors, setEditValidationErrors] = useState({}) // Estado para errores de validación en edición

  const [verDetalleOpen, setVerDetalleOpen] = useState(false)
  const [rolDetalle, setRolDetalle] = useState(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleError, setDetalleError] = useState("") // Para Alert dentro del diálogo VerDetalle

  const [crearValidation, setCrearValidation] = useState({ nombre: "", descripcion: "", permisos: "" })

  const showAlert = (message, severity = "info") => {
    // console.log(`DEBUG Roles.jsx: showAlert - Message: "${message}", Severity: "${severity}"`);
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setSnackbar({ open: false, message: "", severity: "info" })
  }

  const fetchRolesCallback = useCallback(
    async (currentPage, currentSearch) => {
      setLoading(true)
      setError("")

      // Asegurarse de que la página sea al menos 1
      let pageToFetch = Math.max(1, currentPage)

      try {
        const result = await getRoles(pageToFetch, ROLES_POR_PAGINA, currentSearch)
        if (result.error) {
          setError(result.detalles || "Error al cargar roles.")
          setRoles([])
          setTotalPaginasAPI(1)

          // Si hay un error y la página solicitada no existe, intentar redirigir a la primera página si la página actual es mayor a 1
          if (pageToFetch > 1) {
            const newSearchParams = new URLSearchParams(searchParams)
            newSearchParams.set("page", "1")
            setSearchParams(newSearchParams, { replace: true })
            // No establecemos el error aquí, ya que vamos a redirigir
          } else {
            // Si ya estamos en la página 1 y hay un error, mostrarlo
            setError(result.detalles || "Error al cargar roles.")
          }

        } else if (result.success && result.data) {
          setRoles(result.data.roles || [])
          const totalPaginas = result.data.totalPaginas || result.data.paginacion?.totalPaginas || 1
          setTotalPaginasAPI(totalPaginas)

          // Si la página actual es mayor que el total de páginas disponibles y el total de páginas es al menos 1, redirigir a la última página válida.
          // Esto también maneja el caso de que la página actual sea 0 o negativa y el backend devuelva datos válidos.
          if (pageToFetch > totalPaginas && totalPaginas > 0) {
            const newSearchParams = new URLSearchParams(searchParams)
            newSearchParams.set("page", totalPaginas.toString())
            setSearchParams(newSearchParams, { replace: true })
            // Opcional: Podríamos re-fetch aquí para mostrar los datos de la página correcta de inmediato
            // Pero dado que setSearchParams activará un nuevo useEffect, debería funcionar.
          } else if (pageToFetch !== currentPage) {
            // Si pageToFetch fue ajustado (ej. de 0 a 1) y es diferente de currentPage, actualizar la URL
            const newSearchParams = new URLSearchParams(searchParams)
            newSearchParams.set("page", pageToFetch.toString())
            setSearchParams(newSearchParams, { replace: true })
          }
        } else {
          setError("No se recibieron datos de roles o el formato es incorrecto.")
          setRoles([])
          setTotalPaginasAPI(1)
        }
      } catch (err) {
        setError("Error inesperado al cargar roles: " + (err.message || ""))
        setRoles([])
        setTotalPaginasAPI(1)
      } finally {
        setLoading(false)
      }
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    const pageFromUrl = Number.parseInt(searchParams.get("page")) || 1
    const searchFromUrl = searchParams.get("search") || ""

    if (pageFromUrl !== pagina) {
      setPagina(pageFromUrl)
    }
    if (searchFromUrl !== busqueda) {
      setBusqueda(searchFromUrl)
    }
    fetchRolesCallback(pageFromUrl, searchFromUrl)
  }, [searchParams, fetchRolesCallback])

  const handleChangePagina = (event, value) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set("page", value.toString())
    setSearchParams(newSearchParams)
  }

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value
    setBusqueda(newSearchTerm)

    const newSearchParams = new URLSearchParams(searchParams)
    if (newSearchTerm) {
      newSearchParams.set("search", newSearchTerm)
    } else {
      newSearchParams.delete("search")
    }
    newSearchParams.set("page", "1")
    setSearchParams(newSearchParams)
  }

  const rolesFiltrados = roles.filter((rol) => {
    if (!busqueda) return true
    const terminoBusquedaLower = busqueda.toLowerCase().trim()

    if (terminoBusquedaLower === "activo") {
      return rol.estado === true || rol.estado === 1 || rol.estado === "true"
    }
    if (terminoBusquedaLower === "inactivo") {
      return !(rol.estado === true || rol.estado === 1 || rol.estado === "true")
    }
    return rol.nombre?.toLowerCase().includes(terminoBusquedaLower)
    // No buscar por descripción
  })

  const handleEditarRol = async (rol) => {
    setRolAEditar(rol)
    setEditRolOpen(true)
    setEditRolLoading(true)
    setEditRolError("")
    setEditValidationErrors({}) // Limpiar errores al abrir
    try {
      const rolId = Number.parseInt(rol.idrol, 10)
      if (isNaN(rolId)) {
        throw new Error("ID de rol inválido para editar.")
      }
      const data = await getRolById(rolId)
      // Convertir permisos asociados a un array de IDs
      const permisosIds = data.permisos_asociados
        ? data.permisos_asociados
            .map((p) => Number.parseInt(p.permisos_idpermisos || p.id, 10))
            .filter((id) => !isNaN(id))
        : []

      const fetchedRolData = {
        nombre: data.nombre || "",
        descripcion: data.descripcion || "",
        permisos_ids: permisosIds, // Usamos permisos_ids para mantener consistencia con el estado local
      }

      setEditRolData(fetchedRolData) // Establecer datos para el formulario
      setOriginalEditRolData(fetchedRolData) // Guardar datos originales
    } catch (err) {
      const errorMsg = "Error al cargar los datos del rol para editar: " + (err.message || "")
      setEditRolError(errorMsg)
      Swal.fire({
        icon: "error",
        title: "Error al Cargar Datos",
        text: errorMsg,
        confirmButtonColor: "#2E8B57",
        background: "#fff",
        customClass: {
          popup: "animated fadeInDown",
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999
        },
      })
    } finally {
      setEditRolLoading(false)
    }
  }

  // VALIDACIONES EN TIEMPO REAL PARA EDITAR ROL
  const validateEditNombreRol = (nombre) => {
    if (!nombre.trim()) return "El nombre es obligatorio"
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,15}$/.test(nombre)) return "El nombre debe tener entre 3 y 15 letras, sin números"
    return ""
  }

  const validateEditDescripcionRol = (descripcion) => {
    if (!descripcion) return ""
    if (descripcion.length < 3) return "La descripción debe tener al menos 3 caracteres"
    if (descripcion.length > 30) return "La descripción no debe exceder 30 caracteres"
    return ""
  }

  const validateEditPermisosRol = (permisos_ids) => {
    if (!permisos_ids || permisos_ids.length === 0) return "Debe seleccionar al menos un permiso"
    return ""
  }

  useEffect(() => {
    if (editRolOpen) {
      // Solo validar si el diálogo de edición está abierto
      setEditValidationErrors({
        nombre: validateEditNombreRol(editRolData.nombre),
        descripcion: validateEditDescripcionRol(editRolData.descripcion),
        permisos: validateEditPermisosRol(editRolData.permisos_ids),
      })
    }
  }, [editRolData, editRolOpen])

  const isEditRolFormValid = () => {
    const errors = {
      nombre: validateEditNombreRol(editRolData.nombre),
      descripcion: validateEditDescripcionRol(editRolData.descripcion),
      permisos: validateEditPermisosRol(editRolData.permisos_ids),
    }
    return Object.values(errors).every((error) => error === "")
  }

  const handleEditRolFormChange = (e) => {
    const { name, value } = e.target
    setEditRolData((prev) => ({ ...prev, [name]: value }))
    // La validación en tiempo real se maneja por el useEffect
  }

  const handleEditRolPermisoToggle = (id) => {
    setEditRolData((prev) => {
      const yaSeleccionado = prev.permisos_ids.includes(id)
      const newPermisos = yaSeleccionado ? prev.permisos_ids.filter((pid) => pid !== id) : [...prev.permisos_ids, id]
      return {
        ...prev,
        permisos_ids: newPermisos,
      }
    })
  }

  const handleGuardarEdicionRol = async () => {
    if (!rolAEditar || !originalEditRolData) return

    setEditRolError("") // Limpiar errores de API
    // Ejecutar validación final antes de enviar
    if (!isEditRolFormValid()) {
      setEditRolLoading(false)
      return // Detener si el formulario no es válido
    }

    const datosParaEnviar = {}

    // Comparar nombre
    if (editRolData.nombre !== originalEditRolData.nombre) {
      datosParaEnviar.nombre = editRolData.nombre
    }

    // Comparar descripción
    const originalDesc = originalEditRolData.descripcion || ""
    const currentDesc = editRolData.descripcion || ""

    if (currentDesc !== originalDesc) {
      datosParaEnviar.descripcion = currentDesc // Siempre enviar el valor actual si cambió
    }

    // Comparar permisos_ids
    const originalPermisos = originalEditRolData.permisos_ids.slice().sort()
    const currentPermisos = editRolData.permisos_ids.slice().sort()

    if (JSON.stringify(originalPermisos) !== JSON.stringify(currentPermisos)) {
      datosParaEnviar.permisos = editRolData.permisos_ids // Usar la clave 'permisos' que espera el backend
    }

    if (!hasEditChanges()) {
      Swal.fire({
        icon: "info",
        title: "Sin Cambios",
        text: "No hay cambios para guardar",
        confirmButtonColor: "#2E8B57",
        background: "#fff",
        customClass: {
          popup: "animated fadeInDown",
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999
        },
      })
      setEditRolLoading(false)
      return
    }

    setEditRolLoading(true) // Mover aquí para que solo se active si hay cambios y el formulario es válido
    try {
      await updateRol(Number.parseInt(rolAEditar.idrol, 10), datosParaEnviar)
      Swal.fire({
        icon: "success",
        title: "¡Rol Actualizado!",
        text: "Los cambios han sido guardados correctamente",
        timer: 2000,
        showConfirmButton: false,
        position: "center",
        background: "#fff",
        customClass: {
          popup: "animated fadeInDown",
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999
        },
      })
      setEditRolOpen(false)
      setRolAEditar(null)
      // No reiniciar editRolData aquí, se hace al cerrar
      // No reiniciar originalEditRolData aquí, se hace al cerrar
      const currentPageFromUrl = Number.parseInt(searchParams.get("page")) || 1
      const currentSearchFromUrl = searchParams.get("search") || ""
      fetchRolesCallback(currentPageFromUrl, currentSearchFromUrl)
    } catch (err) {
      const errorMsg = err.message || "Error al guardar el rol."
      setEditRolError(errorMsg)
      Swal.fire({
        icon: "error",
        title: "Error al Actualizar",
        text: errorMsg,
        confirmButtonColor: "#2E8B57",
        background: "#fff",
        customClass: {
          popup: "animated fadeInDown",
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999
        },
      })
    } finally {
      setEditRolLoading(false)
    }
  }

  const handleCerrarEdicionRol = () => {
    setEditRolOpen(false)
    setRolAEditar(null)
    setEditRolData({ nombre: "", descripcion: "", permisos_ids: [] })
    setOriginalEditRolData(null) // Limpiar datos originales al cerrar
    setEditRolError("")
    setEditValidationErrors({}) // Limpiar errores de validación al cerrar
  }

  const handleVerDetalle = async (rol) => {
    setVerDetalleOpen(true)
    setDetalleLoading(true)
    setDetalleError("")
    try {
      const rolId = Number.parseInt(rol.idrol, 10)
      if (isNaN(rolId)) {
        throw new Error("ID de rol inválido para ver detalle.")
      }
      const data = await getRolById(rolId)
      setRolDetalle(data)
    } catch (err) {
      const errorMsg = err.message || "Error al cargar detalle del rol."
      setDetalleError(errorMsg)
      Swal.fire({
        icon: "error",
        title: "Error al Cargar Detalle",
        text: errorMsg,
        confirmButtonColor: "#2E8B57",
        background: "#fff",
        customClass: {
          popup: "animated fadeInDown",
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999
        },
      })
    } finally {
      setDetalleLoading(false)
    }
  }

  const handleCrearRol = async (e) => {
    e.preventDefault()
    setCrearLoading(true)
    setCrearError("")
    // Validar antes de enviar
    const validationErrors = {
      nombre: validateNombreRol(nuevoRol.nombre),
      descripcion: validateDescripcionRol(nuevoRol.descripcion),
      permisos: validatePermisosRol(nuevoRol.permisos_ids),
    }
    setCrearValidation(validationErrors)

    if (Object.values(validationErrors).some((error) => error !== "")) {
      setCrearLoading(false)
      return
    }

    try {
      const payload = {
        nombre: nuevoRol.nombre,
        descripcion: nuevoRol.descripcion,
        permisos_ids: nuevoRol.permisos_ids,
      }
      await createRol(payload)
      setCrearOpen(false)
      Swal.fire({
        icon: "success",
        title: "¡Rol Creado!",
        text: "El rol ha sido registrado correctamente",
        timer: 2000,
        showConfirmButton: false,
        position: "center",
        background: "#fff",
        customClass: {
          popup: "animated fadeInDown",
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999
        },
      })
      setNuevoRol({ nombre: "", descripcion: "", permisos_ids: [] })

      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set("page", "1")
      setSearchParams(newSearchParams)
    } catch (err) {
      const errorMsg = err.message || "Error al crear el rol."
      setCrearError(errorMsg)
      Swal.fire({
        icon: "error",
        title: "Error al Crear Rol",
        text: errorMsg,
        confirmButtonColor: "#2E8B57",
        background: "#fff",
        customClass: {
          popup: "animated fadeInDown",
        },
        zIndex: 99999,
        didOpen: (popup) => {
          popup.style.zIndex = 99999
        },
      })
    } finally {
      setCrearLoading(false)
    }
  }

  const handlePermisoToggle = (id) => {
    setNuevoRol((prev) => {
      const yaSeleccionado = prev.permisos_ids.includes(id)
      return {
        ...prev,
        permisos_ids: yaSeleccionado ? prev.permisos_ids.filter((pid) => pid !== id) : [...prev.permisos_ids, id],
      }
    })
  }

  const handleEliminadoExitoso = async (idRolEliminado) => {
    setEliminarOpen(false)
    Swal.fire({
      icon: "success",
      title: "¡Rol Eliminado!",
      text: "El rol ha sido eliminado correctamente",
      timer: 2000,
      showConfirmButton: false,
      position: "center",
      background: "#fff",
      customClass: {
        popup: "animated fadeInDown",
      },
      zIndex: 99999,
      didOpen: (popup) => {
        popup.style.zIndex = 99999
      },
    })

    const currentSearchFromUrl = searchParams.get("search") || ""
    const currentPageFromUrl = Number.parseInt(searchParams.get("page")) || 1

    fetchRolesCallback(currentPageFromUrl, currentSearchFromUrl)
  }

  // VALIDACIONES EN TIEMPO REAL PARA CREAR ROL
  const validateNombreRol = (nombre) => {
    if (!nombre.trim()) return "El nombre es obligatorio"
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,15}$/.test(nombre)) return "El nombre debe tener entre 3 y 15 letras, sin números"
    return ""
  }
  const validateDescripcionRol = (descripcion) => {
    if (!descripcion) return ""
    if (descripcion.length < 3) return "La descripción debe tener al menos 3 caracteres"
    if (descripcion.length > 30) return "La descripción no debe exceder 30 caracteres"
    return ""
  }
  const validatePermisosRol = (permisos_ids) => {
    if (!permisos_ids || permisos_ids.length === 0) return "Debe seleccionar al menos un permiso"
    return ""
  }

  useEffect(() => {
    setCrearValidation({
      nombre: validateNombreRol(nuevoRol.nombre),
      descripcion: validateDescripcionRol(nuevoRol.descripcion),
      permisos: validatePermisosRol(nuevoRol.permisos_ids),
    })
  }, [nuevoRol])

  const isCrearRolValid = !crearValidation.nombre && !crearValidation.descripcion && !crearValidation.permisos

  const hasEditChanges = () => {
    if (!originalEditRolData) {
      return false
    }
    // Comparar nombre
    if (editRolData.nombre !== originalEditRolData.nombre) {
      return true
    }

    // Comparar descripción
    const originalDesc = originalEditRolData.descripcion || ""
    const currentDesc = editRolData.descripcion || ""

    if (currentDesc !== originalDesc) {
      return true // Siempre enviar el valor actual si cambió
    }

    // Comparar permisos_ids
    const originalPermisos = originalEditRolData.permisos_ids.slice().sort()
    const currentPermisos = editRolData.permisos_ids.slice().sort()

    if (JSON.stringify(originalPermisos) !== JSON.stringify(currentPermisos)) {
      return true
    }
    return false
  }

  // console.log("RENDER Roles.jsx - snackbar:", snackbar);

  return (
    <Box p={3} sx={{ position: "relative" }}>
      <Typography variant="h5" gutterBottom>
        Roles Registrados
      </Typography>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        gap={2}
      >
        <Box sx={{ flexGrow: 1, width: { xs: "100%", sm: 350 } }}>
          <Buscador value={busqueda} onChange={handleSearchChange} placeholder="Buscar rol (Nombre, Activo...)" />
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            setNuevoRol({ nombre: "", descripcion: "", permisos_ids: [] })
            setCrearError("")
            setCrearValidation({ nombre: "", descripcion: "", permisos: "" }) // Limpiar validaciones al abrir
            setCrearOpen(true)
          }}
          sx={{ minWidth: 140, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}
          startIcon={<AddIcon />}
        >
          Registrar Rol
        </Button>
      </Box>
      <Box mb={2} height={40} display="flex" alignItems="center" justifyContent="center">
        {loading && <CircularProgress size={28} />}
        {error && !loading && (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        )}
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>#</b>
              </TableCell>
              <TableCell>
                <b>Nombre</b>
              </TableCell>
              <TableCell align="center">
                <b>Estado</b>
              </TableCell>
              <TableCell align="center">
                <b>Acciones</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && rolesFiltrados.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {busqueda ? "No se encontraron roles que coincidan con la búsqueda." : "No hay roles registrados."}
                </TableCell>
              </TableRow>
            )}
            {rolesFiltrados.map((rol, idx) => {
              const rolActivo = rol.estado === true || rol.estado === 1 || rol.estado === "true"
              return (
                <TableRow key={rol.idrol || idx}>
                  <TableCell>{(pagina - 1) * ROLES_POR_PAGINA + idx + 1}</TableCell>
                  <TableCell>{rol.nombre}</TableCell>
                  <TableCell align="center">
                    <CambiarEstado
                      id={rol.idrol}
                      estadoActual={rolActivo}
                      onEstadoCambiado={(idRol, nuevoEstado, errorMsg) => {
                        if (errorMsg) {
                          showAlert(`Error al cambiar estado: ${errorMsg}`, "error")
                        } else {
                          setRoles((prev) => prev.map((r) => (r.idrol === idRol ? { ...r, estado: nuevoEstado } : r)))
                          showAlert(`Estado del rol ${rol.nombre} cambiado.`, "success")
                        }
                      }}
                      updateEstadoApi={updateEstadoRol}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton color="info" size="small" onClick={() => handleVerDetalle(rol)}>
                        <VisibilityIcon />
                      </IconButton>
                      {rolActivo && (
                        <>
                          <IconButton color="warning" size="small" onClick={() => handleEditarRol(rol)}>
                            <EditIcon />
                          </IconButton>
                          {rol.idrol !== 1 && (
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                setRolEliminar(rol)
                                setEliminarOpen(true)
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && totalPaginasAPI > 1 && (
        <Stack direction="row" justifyContent="center" alignItems="center" mt={3}>
          <Pagination
            count={totalPaginasAPI}
            page={pagina}
            onChange={handleChangePagina}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? 6000 : 3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        key={snackbar.message + snackbar.severity + snackbar.open.toString()} // Key más única
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #e0e0e0",
            py: 2.5,
          }}
        >
          <AddIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography component="span" variant="h6" sx={{ fontWeight: 600 }}>
            Registrar Nuevo Rol
          </Typography>
        </DialogTitle>
        <form onSubmit={handleCrearRol} autoComplete="off" noValidate>
          <DialogContent dividers sx={{ p: 3, backgroundColor: "#fff", maxHeight: "70vh", overflowY: "auto" }}>
            <Grid container spacing={3}>
              {/* Información General */}
              <Grid sx={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Información General
                    </Typography>
                  </Box>
                  <Box display="flex" gap={2} width="100%">
                    <TextField
                      label="Nombre del Rol"
                      name="nombre"
                      value={nuevoRol.nombre}
                      onChange={(e) => setNuevoRol((prev) => ({ ...prev, nombre: e.target.value }))}
                      required
                      autoFocus
                      error={!!crearValidation.nombre}
                      helperText={crearValidation.nombre}
                      sx={{ height: 56, width: 320, flex: 'none' }}
                    />
                    <TextField
                      label="Descripción del Rol"
                      name="descripcion"
                      value={nuevoRol.descripcion}
                      onChange={(e) => setNuevoRol((prev) => ({ ...prev, descripcion: e.target.value }))}
                      error={!!crearValidation.descripcion}
                      helperText={crearValidation.descripcion}
                      sx={{ height: 56, flex: 5, width: 320, minWidth: 0 }}
                    />
                  </Box>
                </Paper>
              </Grid>
              {/* Permisos Asignados */}
              <Grid sx={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SecurityIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Permisos Asignados
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {PERMISOS_DISPONIBLES.map((permiso) => (
                      <Grid key={permiso.id} sx={{ xs: 12, sm: 6, md: 6 }}>
                        <Paper
                          elevation={nuevoRol.permisos_ids.includes(permiso.id) ? 3 : 0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: nuevoRol.permisos_ids.includes(permiso.id)
                              ? "2px solid #1976d2"
                              : "1px solid #e0e0e0",
                            backgroundColor: nuevoRol.permisos_ids.includes(permiso.id) ? "#e3f2fd" : "#fff",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.12)",
                              borderColor: "#1976d2",
                            },
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                          onClick={() => handlePermisoToggle(permiso.id)}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {permiso.nombre} (ID: {permiso.id})
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  {crearValidation.permisos && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {crearValidation.permisos}
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: "#f8f9fa", borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={() => setCrearOpen(false)}
              color="secondary"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={crearLoading || !isCrearRolValid}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              {crearLoading ? <CircularProgress size={18} /> : "Registrar Rol"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {rolDetalle && (
        <Dialog
          open={verDetalleOpen}
          onClose={() => setVerDetalleOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "#f8f9fa",
              borderBottom: "1px solid #e0e0e0",
              py: 2.5,
            }}
          >
            <EditIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography component="span" variant="h6" sx={{ fontWeight: 600 }}>
              Detalle de Rol
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: "#fff" }}>
            {detalleLoading && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress size={40} />
              </Box>
            )}
            {detalleError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {detalleError}
              </Alert>
            )}
            {!detalleLoading && !detalleError && rolDetalle && (
              <Box mt={2}>
                <Grid container spacing={3}>
                  {/* Información General */}
                  <Grid sx={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Información General
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid sx={{ xs: 12, sm: 6 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            ID del Rol
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {rolDetalle.idrol}
                          </Typography>
                        </Grid>
                        <Grid sx={{ xs: 12, sm: 6 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Nombre del Rol
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {rolDetalle.nombre}
                          </Typography>
                        </Grid>
                        <Grid sx={{ xs: 12, sm: 6 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Estado
                          </Typography>
                          <Chip
                            icon={rolDetalle.estado ? <CheckCircleIcon /> : <CancelIcon />}
                            label={rolDetalle.estado ? "Activo" : "Inactivo"}
                            color={rolDetalle.estado ? "success" : "error"}
                            size="small"
                            sx={{ mt: 0.5, "& .MuiChip-label": { fontWeight: 500 } }}
                          />
                        </Grid>
                        <Grid sx={{ xs: 12 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Descripción
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              backgroundColor: "#fff",
                              p: 2,
                              borderRadius: 1,
                              border: "1px solid #e0e0e0",
                              minHeight: "60px",
                            }}
                          >
                            {rolDetalle.descripcion || "Sin descripción"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  {/* Permisos Asociados */}
                  <Grid sx={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <SecurityIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Permisos Asignados
                        </Typography>
                      </Box>
                      {rolDetalle.permisos_asociados && rolDetalle.permisos_asociados.length > 0 ? (
                        <Grid container spacing={2}>
                          {rolDetalle.permisos_asociados.map((p, idx) => (
                            <Grid key={p.permisos_idpermisos || p.id || idx} sx={{ xs: 12, sm: 6, md: 6 }}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 2,
                                  backgroundColor: "#fff",
                                  border: "1px solid #e0e0e0",
                                  borderRadius: 1,
                                  height: "100%",
                                  transition: "transform 0.2s, box-shadow 0.2s",
                                  "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
                                }}
                              >
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                  {p.permiso?.nombre || `ID: ${p.permisos_idpermisos || p.id}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {p.permiso?.descripcion || "Sin descripción"}
                                </Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ backgroundColor: "#fff", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}
                        >
                          No hay permisos asociados.
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: "#f8f9fa", borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={() => setVerDetalleOpen(false)}
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={editRolOpen}
        onClose={handleCerrarEdicionRol}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            overflow: "hidden",
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleGuardarEdicionRol()
          }}
          autoComplete="off"
          noValidate
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "#f8f9fa",
              borderBottom: "1px solid #e0e0e0",
              py: 2.5,
            }}
          >
            <EditIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography component="span" variant="h6" sx={{ fontWeight: 600 }}>
              Editar Rol
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: "#fff", maxHeight: "70vh", overflowY: "auto" }}>
            {editRolLoading && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress size={40} />
              </Box>
            )}
            {editRolError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editRolError}
              </Alert>
            )}
            {!editRolLoading && !editRolError && rolAEditar && originalEditRolData && (
              <Grid container spacing={3}>
                {/* Información General */}
                <Grid sx={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Información General
                      </Typography>
                    </Box>
                    <Box display="flex" gap={2} width="100%">
                      <TextField
                        label="Nombre del Rol"
                        name="nombre"
                        value={editRolData.nombre}
                        onChange={handleEditRolFormChange}
                        required
                        autoFocus
                        error={!!editValidationErrors.nombre}
                        helperText={editValidationErrors.nombre}
                        sx={{ height: 56, width: 320, flex: 'none' }}
                      />
                      <TextField
                        label="Descripción del Rol"
                        name="descripcion"
                        value={editRolData.descripcion}
                        onChange={handleEditRolFormChange}
                        error={!!editValidationErrors.descripcion}
                        helperText={editValidationErrors.descripcion}
                        sx={{ height: 56, flex: 5, width: 320, minWidth: 0 }}
                      />
                    </Box>
                  </Paper>
                </Grid>
                {/* Permisos Asignados */}
                <Grid sx={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <SecurityIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Permisos Asignados
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {PERMISOS_DISPONIBLES.map((permiso) => (
                        <Grid key={permiso.id} sx={{ xs: 12, sm: 6, md: 6 }}>
                          <Paper
                            elevation={editRolData.permisos_ids.includes(permiso.id) ? 3 : 0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: editRolData.permisos_ids.includes(permiso.id)
                                ? "2px solid #1976d2"
                                : "1px solid #e0e0e0",
                              backgroundColor: editRolData.permisos_ids.includes(permiso.id) ? "#e3f2fd" : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": {
                                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.12)",
                                borderColor: "#1976d2",
                              },
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                            onClick={() => handleEditRolPermisoToggle(permiso.id)}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {permiso.nombre} (ID: {permiso.id})
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    {editValidationErrors.permisos && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {editValidationErrors.permisos}
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, backgroundColor: "#f8f9fa", borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={handleCerrarEdicionRol}
              color="secondary"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={editRolLoading || !hasEditChanges() || !isEditRolFormValid()}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              }}
            >
              {editRolLoading ? <CircularProgress size={18} /> : "Guardar Cambios"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Eliminar
        id={rolEliminar?.idrol}
        open={eliminarOpen}
        onClose={() => setEliminarOpen(false)}
        onEliminado={handleEliminadoExitoso} // Para éxito
        onError={(errorMsg) => showAlert(`Error al eliminar rol: ${errorMsg}`, "error")} // Para error
        nombre={rolEliminar ? rolEliminar.nombre : ""}
        tipoEntidad="rol"
        deleteApi={deleteRol}
      />
    </Box>
  )
}

// Agregar estilos globales para SweetAlert2
const style = document.createElement("style")
style.textContent = `
    .swal2-container {
      z-index: 99999 !important;
    }
    .swal2-popup {
      z-index: 99999 !important;
    }
  `
document.head.appendChild(style)

export default Roles
